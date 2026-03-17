import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Toast } from '@core/services/toast';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';


@Component({
  selector: 'sga-classroom-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tasks implements OnInit {
  private store = inject(ClassroomStore);
  private api = inject(ClassroomApi);
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthFacade);
  private readonly toast = inject(Toast);

  public tasks = signal<ClassroomTask[]>([]);
  public sectionCourseId = signal('');
  public submittingTaskId = signal<string | null>(null);
  public reviewingSubmissionId = signal<string | null>(null);
  public submissionDrafts = signal<Record<string, { submissionText: string; linkUrl: string; fileUrl: string; fileName: string }>>({});
  public reviewDrafts = signal<Record<string, { score: string; feedback: string }>>({});
  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly canSubmitTask = computed(() => this.profileType() === 'student');
  readonly canInspectStudentSubmissions = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'guardian';
  });
  readonly canReviewTask = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });
  readonly pageLabel = computed(() => {
    const type = this.profileType();
    if (type === 'student') return 'Tus tareas publicadas para este curso.';
    if (type === 'guardian') return 'Tareas visibles para los estudiantes vinculados.';
    return 'Vista general de tareas publicadas en el aula.';
  });

  statusLabel(status: ClassroomTask['status']) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

  ngOnInit(): void {
    const id =
      this.store.selectedSectionId() ??
      (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');

    if (id) {
      this.sectionCourseId.set(id);
      this.loadTasks(id);
    } else {
      this.tasks.set([]);
    }
  }

  loadTasks(sectionCourseId = this.sectionCourseId()) {
    if (!sectionCourseId) return;

    this.api.getTasks(sectionCourseId).subscribe({
      next: (list) => this.tasks.set(Array.isArray(list) ? list : []),
      error: () => this.tasks.set([]),
    });
  }

  getSubmissionDraft(taskId: string) {
    return (
      this.submissionDrafts()[taskId] ?? {
        submissionText: '',
        linkUrl: '',
        fileUrl: '',
        fileName: '',
      }
    );
  }

  updateSubmissionDraft(taskId: string, patch: Partial<{ submissionText: string; linkUrl: string; fileUrl: string; fileName: string }>) {
    this.submissionDrafts.update((current) => ({
      ...current,
      [taskId]: {
        ...this.getSubmissionDraft(taskId),
        ...patch,
      },
    }));
  }

  onTaskFileSelected(taskId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.api.uploadFile(file).subscribe({
      next: (res) => {
        this.updateSubmissionDraft(taskId, {
          fileUrl: res.url,
          fileName: res.name,
        });
      },
      error: () => this.toast.error('No se pudo subir el archivo'),
    });
  }

  submitTask(task: ClassroomTask) {
    const sectionCourseId = this.sectionCourseId();
    const draft = this.getSubmissionDraft(task.id);
    if (!sectionCourseId) return;
    if (!draft.submissionText && !draft.linkUrl && !draft.fileUrl) {
      this.toast.error('Agrega texto, enlace o archivo para entregar');
      return;
    }

    this.submittingTaskId.set(task.id);
    this.api
      .submitTask(sectionCourseId, task.id, {
        submissionText: draft.submissionText || undefined,
        linkUrl: draft.linkUrl || undefined,
        fileUrl: draft.fileUrl || undefined,
        fileName: draft.fileName || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Entrega registrada');
          this.submissionDrafts.update((current) => ({
            ...current,
            [task.id]: { submissionText: '', linkUrl: '', fileUrl: '', fileName: '' },
          }));
          this.loadTasks();
          this.submittingTaskId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo registrar la entrega');
          this.submittingTaskId.set(null);
        },
      });
  }

  getReviewDraft(submissionId: string) {
    return this.reviewDrafts()[submissionId] ?? { score: '', feedback: '' };
  }

  updateReviewDraft(submissionId: string, patch: Partial<{ score: string; feedback: string }>) {
    this.reviewDrafts.update((current) => ({
      ...current,
      [submissionId]: {
        ...this.getReviewDraft(submissionId),
        ...patch,
      },
    }));
  }

  reviewSubmission(taskId: string, submissionId: string) {
    const sectionCourseId = this.sectionCourseId();
    const draft = this.getReviewDraft(submissionId);
    const score = Number(draft.score);
    if (!sectionCourseId || !submissionId || Number.isNaN(score)) {
      this.toast.error('Ingresa un puntaje valido');
      return;
    }

    this.reviewingSubmissionId.set(submissionId);
    this.api
      .reviewTaskSubmission(sectionCourseId, taskId, submissionId, {
        score,
        feedback: draft.feedback || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Entrega calificada');
          this.loadTasks();
          this.reviewingSubmissionId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo calificar la entrega');
          this.reviewingSubmissionId.set(null);
        },
      });
  }
}
