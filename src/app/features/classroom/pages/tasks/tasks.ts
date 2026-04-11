import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Toast } from '@core/services/toast';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ClassroomStore } from '../../services/store/classroom.store';
import {
  ClassroomApi,
  type ClassroomTask,
  type ClassroomTaskEditorPayload,
} from '../../services/classroom-api';
import { ClassroomSocketService } from '../../services/classroom-socket';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { TaskCreateForm } from '../../components/task-create-form/task-create-form';
import { ClassroomTasksStats } from '../../components/classroom-tasks-stats/classroom-tasks-stats';
import { ClassroomTasksHeader } from '../../components/classroom-tasks-header/classroom-tasks-header';
import { ClassroomTasksFilters } from '../../components/classroom-tasks-filters/classroom-tasks-filters';
import { ClassroomTaskItem } from '../../components/classroom-task-item/classroom-task-item';

@Component({
  selector: 'sga-classroom-tasks',

  imports: [ClassroomTasksStats, ClassroomTasksHeader, ClassroomTasksFilters, ClassroomTaskItem],
  templateUrl: './tasks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tasks implements OnInit, OnDestroy {
  private store = inject(ClassroomStore);
  private api = inject(ClassroomApi);
  private readonly socket = inject(ClassroomSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);
  private readonly toast = inject(Toast);
  private readonly dialog = inject(DialogModalService);
  private readonly confirmDialog = inject(DialogConfirmService);
  private readonly destroy$ = new Subject<void>();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  public tasks = signal<ClassroomTask[]>([]);
  public sectionCourseId = signal('');
  public search = signal('');
  public tasksNextCursor = signal<{ date: string; id: string } | null>(null);
  public tasksHasNext = signal(false);
  public loading = signal(false);
  public loadingMore = signal(false);

  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly currentUserId = computed(() => this.authFacade.getCurrentUser()?.id ?? null);

  readonly canCreateTask = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });
  readonly canSubmitTask = computed(() => this.profileType() === 'student');
  readonly canInspectStudentSubmissions = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'guardian';
  });
  readonly canReviewTask = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });
  readonly canCommentTask = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'student';
  });

  readonly pageLabel = computed(() => {
    const type = this.profileType();
    if (type === 'student') return 'Tus tareas publicadas para este curso.';
    if (type === 'guardian') return 'Tareas visibles para los estudiantes vinculados.';
    return 'Vista general de tareas publicadas en el aula.';
  });

  readonly filteredTasks = computed(() => {
    return this.tasks();
  });

  readonly pendingCount = computed(
    () => this.filteredTasks().filter((task) => task.status === 'pending').length,
  );
  readonly deliveredCount = computed(
    () => this.filteredTasks().filter((task) => task.status === 'delivered').length,
  );
  readonly gradedCount = computed(
    () => this.filteredTasks().filter((task) => task.status === 'graded').length,
  );
  readonly lateCount = computed(
    () => this.filteredTasks().filter((task) => task.status === 'late').length,
  );

  statusLabel(status: ClassroomTask['status']) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

  ngOnInit(): void {
    const id =
      this.store.selectedSectionId() ?? this.route.parent?.snapshot?.paramMap?.get('id') ?? '';
    if (id) {
      this.sectionCourseId.set(id);
      this.loadTasks(id);
      this.socket.taskEvent$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        if (event.action === 'deleted' && event.id) {
          this.tasks.update((items) => items.filter((task) => task.id !== event.id));
          return;
        }

        if (event.action === 'updated' && event.task) {
          this.tasks.update((items) => {
            const index = items.findIndex((task) => task.id === event.task!.id);
            if (index >= 0) {
              return items.map((task) => (task.id === event.task!.id ? event.task! : task));
            }
            return [event.task!, ...items];
          });
        }
      });
    }
  }

  loadTasks(sectionCourseId = this.sectionCourseId()) {
    if (!sectionCourseId) return;
    this.loading.set(true);
    this.api
      .getTasksCursor(sectionCourseId, {
        limit: 12,
        search: this.search().trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.tasks.set(Array.isArray(response.data) ? response.data : []);
          this.tasksNextCursor.set(response.nextCursor);
          this.tasksHasNext.set(response.hasNext);
          this.loading.set(false);
        },
        error: () => {
          this.tasks.set([]);
          this.tasksNextCursor.set(null);
          this.tasksHasNext.set(false);
          this.loading.set(false);
        },
      });
  }

  loadMoreTasks() {
    const sectionCourseId = this.sectionCourseId();
    const cursor = this.tasksNextCursor();
    if (!sectionCourseId || !cursor || this.loadingMore() || !this.tasksHasNext()) return;

    this.loadingMore.set(true);
    this.api
      .getTasksCursor(sectionCourseId, {
        cursorDate: cursor.date,
        cursorId: cursor.id,
        limit: 12,
        search: this.search().trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          const existingIds = new Set(this.tasks().map((task) => task.id));
          this.tasks.update((items) => [
            ...items,
            ...(response.data ?? []).filter((task) => !existingIds.has(task.id)),
          ]);
          this.tasksNextCursor.set(response.nextCursor);
          this.tasksHasNext.set(response.hasNext);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loadingMore.set(false);
        },
      });
  }

  clearSearch() {
    this.onSearchChange('');
  }

  onSearchChange(value: string) {
    this.search.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.loadTasks();
    }, 280);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.loading() || this.loadingMore() || !this.tasksHasNext()) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = document.documentElement.scrollHeight || 0;

    if (scrollTop + viewportHeight >= documentHeight - 240) {
      this.loadMoreTasks();
    }
  }

  openCreateTask() {
    const sectionCourseId = this.sectionCourseId();
    if (!sectionCourseId) return;

    const ref = this.dialog.open(TaskCreateForm, {
      data: { sectionCourseId, mode: 'create' as const },
      width: '960px',
      maxHeight: '80vh',
    });

    ref.closed.subscribe((payload) => this.handleTaskFormClose(payload, 'create'));
  }

  openEditTask(taskId: string) {
    const sectionCourseId = this.sectionCourseId();
    if (!sectionCourseId) return;

    this.api.getTaskEditor(sectionCourseId, taskId).subscribe({
      next: (task: ClassroomTaskEditorPayload) => {
        const ref = this.dialog.open(TaskCreateForm, {
          data: { sectionCourseId, mode: 'edit' as const, task },
          width: '960px',
          maxHeight: '80vh',
        });
        ref.closed.subscribe((payload) => this.handleTaskFormClose(payload, 'edit', taskId));
      },
      error: () => this.toast.error('No se pudo cargar la tarea para edición'),
    });
  }

  private handleTaskFormClose(payload: unknown, mode: 'create' | 'edit', assignmentId?: string) {
    const sectionCourseId = this.sectionCourseId();
    if (!payload || !sectionCourseId) return;

    if (mode === 'edit' && assignmentId) {
      this.api.updateTask(sectionCourseId, assignmentId, payload as any).subscribe({
        next: () => {
          this.toast.success('Tarea actualizada');
          this.loadTasks();
          this.store.loadFeed(sectionCourseId);
        },
        error: () => this.toast.error('No se pudo actualizar la tarea'),
      });
      return;
    }

    this.api.createTask(sectionCourseId, payload as any).subscribe({
      next: () => {
        this.toast.success('Tarea creada');
        this.loadTasks();
        this.store.loadFeed(sectionCourseId);
      },
      error: () => this.toast.error('No se pudo crear la tarea'),
    });
  }

  async deleteTask(task: ClassroomTask) {
    const sectionCourseId = this.sectionCourseId();
    if (!sectionCourseId) return;

    const confirmed = await this.confirmDialog.open({
      title: 'Eliminar tarea',
      message: `Se eliminará "${task.title}" del aula virtual.`,
      icon: 'fa-solid fa-trash',
      type: 'danger',
      acceptButtonProps: { label: 'Eliminar' },
      rejectButtonProps: { label: 'Cancelar' },
    });

    if (!confirmed) return;

    this.api.deleteTask(sectionCourseId, task.id).subscribe({
      next: () => {
        this.toast.success('Tarea eliminada');
        this.loadTasks();
        this.store.loadFeed(sectionCourseId);
      },
      error: () => this.toast.error('No se pudo eliminar la tarea'),
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
