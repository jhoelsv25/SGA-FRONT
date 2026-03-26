import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Toast } from '@core/services/toast';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomTask, type ClassroomTaskEditorPayload } from '../../services/classroom-api';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { TaskCreateForm } from '../../components/task-create-form/task-create-form';


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
  private readonly dialog = inject(DialogModalService);
  private readonly confirmDialog = inject(DialogConfirmService);

  public tasks = signal<ClassroomTask[]>([]);
  public sectionCourseId = signal('');
  public submittingTaskId = signal<string | null>(null);
  public reviewingSubmissionId = signal<string | null>(null);
  public submissionDrafts = signal<Record<string, { submissionText: string; linkUrl: string; fileUrl: string; fileName: string }>>({});
  public quizDrafts = signal<
    Record<
      string,
      Record<
        string,
        {
          selectedOptionIds: string[];
          answerText: string;
        }
      >
    >
  >({});
  public reviewDrafts = signal<Record<string, { score: string; feedback: string }>>({});
  public search = signal('');
  public expandedCommentTaskId = signal<string | null>(null);
  public taskCommentDrafts = signal<Record<string, string>>({});
  public editingTaskCommentId = signal<string | null>(null);
  public editingTaskCommentContent = signal('');
  public savingTaskCommentId = signal<string | null>(null);
  public deletingTaskCommentId = signal<string | null>(null);
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
    const term = this.search().trim().toLowerCase();
    if (!term) return this.tasks();
    return this.tasks().filter((task) =>
      task.title.toLowerCase().includes(term) ||
      this.statusLabel(task.status).toLowerCase().includes(term)
    );
  });
  readonly pendingCount = computed(() => this.filteredTasks().filter((task) => task.status === 'pending').length);
  readonly deliveredCount = computed(() => this.filteredTasks().filter((task) => task.status === 'delivered').length);
  readonly gradedCount = computed(() => this.filteredTasks().filter((task) => task.status === 'graded').length);
  readonly lateCount = computed(() => this.filteredTasks().filter((task) => task.status === 'late').length);

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

  clearSearch() {
    this.search.set('');
  }

  private replaceTask(updatedTask: ClassroomTask | null | undefined) {
    if (!updatedTask?.id) return;
    this.tasks.update((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }

  isTaskCommentsExpanded(taskId: string) {
    return this.expandedCommentTaskId() === taskId;
  }

  toggleTaskComments(taskId: string) {
    this.expandedCommentTaskId.update((current) => (current === taskId ? null : taskId));
  }

  getTaskCommentDraft(taskId: string) {
    return this.taskCommentDrafts()[taskId] ?? '';
  }

  updateTaskCommentDraft(taskId: string, value: string) {
    this.taskCommentDrafts.update((current) => ({ ...current, [taskId]: value }));
  }

  canManageTaskComment(comment: NonNullable<ClassroomTask['comments']>[number]) {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUserId() && comment.author.id === this.currentUserId());
  }

  startEditTaskComment(comment: NonNullable<ClassroomTask['comments']>[number]) {
    this.editingTaskCommentId.set(comment.id);
    this.editingTaskCommentContent.set(comment.content);
  }

  cancelEditTaskComment() {
    this.editingTaskCommentId.set(null);
    this.editingTaskCommentContent.set('');
  }

  submitTaskComment(task: ClassroomTask) {
    const sectionCourseId = this.sectionCourseId();
    const content = this.getTaskCommentDraft(task.id).trim();
    if (!sectionCourseId || !content) return;

    this.savingTaskCommentId.set(task.id);
    this.api.createTaskComment(sectionCourseId, task.id, content).subscribe({
      next: (updatedTask) => {
        this.replaceTask(updatedTask);
        this.updateTaskCommentDraft(task.id, '');
        this.expandedCommentTaskId.set(task.id);
        this.savingTaskCommentId.set(null);
        this.toast.success('Comentario agregado');
      },
      error: () => {
        this.savingTaskCommentId.set(null);
        this.toast.error('No se pudo registrar el comentario');
      },
    });
  }

  saveTaskComment(task: ClassroomTask, commentId: string) {
    const sectionCourseId = this.sectionCourseId();
    const content = this.editingTaskCommentContent().trim();
    if (!sectionCourseId || !content) return;

    this.savingTaskCommentId.set(task.id);
    this.api.updateTaskComment(sectionCourseId, task.id, commentId, content).subscribe({
      next: (updatedTask) => {
        this.replaceTask(updatedTask);
        this.cancelEditTaskComment();
        this.savingTaskCommentId.set(null);
        this.toast.success('Comentario actualizado');
      },
      error: () => {
        this.savingTaskCommentId.set(null);
        this.toast.error('No se pudo actualizar el comentario');
      },
    });
  }

  deleteTaskComment(task: ClassroomTask, commentId: string) {
    const sectionCourseId = this.sectionCourseId();
    if (!sectionCourseId) return;

    this.deletingTaskCommentId.set(commentId);
    this.api.deleteTaskComment(sectionCourseId, task.id, commentId).subscribe({
      next: (updatedTask) => {
        this.replaceTask(updatedTask);
        if (this.editingTaskCommentId() === commentId) {
          this.cancelEditTaskComment();
        }
        this.deletingTaskCommentId.set(null);
        this.toast.success('Comentario eliminado');
      },
      error: () => {
        this.deletingTaskCommentId.set(null);
        this.toast.error('No se pudo eliminar el comentario');
      },
    });
  }

  private handleTaskFormClose(
    payload: unknown,
    mode: 'create' | 'edit',
    assignmentId?: string,
  ) {
    const sectionCourseId = this.sectionCourseId();
    const taskPayload = payload as
      | {
        title: string;
        description?: string;
        instructions?: string;
        dueDate: string;
        maxScore?: number;
        lateSubmissionAllowed?: boolean;
        maxAttempts?: number;
        type?: string;
        resourceUrl?: string;
        questions?: Array<{
          prompt: string;
          type: 'single_choice' | 'multiple_choice' | 'short_answer';
          points?: number;
          required?: boolean;
          options?: Array<{ label: string; isCorrect?: boolean }>;
        }>;
      }
      | undefined;
    if (!taskPayload || !sectionCourseId) return;

    if (mode === 'edit' && assignmentId) {
      this.api.updateTask(sectionCourseId, assignmentId, taskPayload).subscribe({
        next: () => {
          this.toast.success('Tarea actualizada');
          this.loadTasks();
          this.store.loadFeed(this.sectionCourseId());
        },
        error: () => {
          this.toast.error('No se pudo actualizar la tarea');
        },
      });
      return;
    }

    this.api.createTask(sectionCourseId, taskPayload).subscribe({
      next: () => {
        this.toast.success('Tarea creada');
        this.loadTasks();
        this.store.loadFeed(this.sectionCourseId());
      },
      error: () => {
        this.toast.error('No se pudo crear la tarea');
      },
    });
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
      error: () => {
        this.toast.error('No se pudo cargar la tarea para edición');
      },
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
        this.store.loadFeed(this.sectionCourseId());
      },
      error: () => {
        this.toast.error('No se pudo eliminar la tarea');
      },
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

  isQuiz(task: ClassroomTask) {
    return task.type === 'quiz';
  }

  getQuizQuestionDraft(taskId: string, questionId: string) {
    return (
      this.quizDrafts()[taskId]?.[questionId] ?? {
        selectedOptionIds: [],
        answerText: '',
      }
    );
  }

  updateQuizAnswer(taskId: string, questionId: string, patch: { selectedOptionIds?: string[]; answerText?: string }) {
    this.quizDrafts.update((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? {}),
        [questionId]: {
          ...this.getQuizQuestionDraft(taskId, questionId),
          ...patch,
        },
      },
    }));
  }

  toggleQuizOption(taskId: string, questionId: string, optionId: string, multiple: boolean) {
    const current = this.getQuizQuestionDraft(taskId, questionId).selectedOptionIds;
    const next = multiple
      ? current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId]
      : [optionId];
    this.updateQuizAnswer(taskId, questionId, { selectedOptionIds: next });
  }

  submitTask(task: ClassroomTask) {
    const sectionCourseId = this.sectionCourseId();
    const draft = this.getSubmissionDraft(task.id);
    if (!sectionCourseId) return;
    const isQuiz = this.isQuiz(task);
    const answers = (task.questions ?? []).map((question) => {
      const current = this.getQuizQuestionDraft(task.id, question.id);
      return {
        questionId: question.id,
        selectedOptionIds: current.selectedOptionIds,
        answerText: current.answerText,
      };
    });

    if (isQuiz && !answers.some((answer) => answer.selectedOptionIds.length || answer.answerText.trim())) {
      this.toast.error('Responde al menos una pregunta del quiz');
      return;
    }

    if (!isQuiz && !draft.submissionText && !draft.linkUrl && !draft.fileUrl) {
      this.toast.error('Agrega texto, enlace o archivo para entregar');
      return;
    }

    this.submittingTaskId.set(task.id);
    this.api
      .submitTask(sectionCourseId, task.id, {
        submissionText: isQuiz ? undefined : draft.submissionText || undefined,
        linkUrl: isQuiz ? undefined : draft.linkUrl || undefined,
        fileUrl: isQuiz ? undefined : draft.fileUrl || undefined,
        fileName: isQuiz ? undefined : draft.fileName || undefined,
        answers: isQuiz ? answers : undefined,
      })
      .subscribe({
        next: (result) => {
          this.toast.success(result.score !== undefined ? `Quiz enviado. Puntaje: ${result.score}` : 'Entrega registrada');
          this.submissionDrafts.update((current) => ({
            ...current,
            [task.id]: { submissionText: '', linkUrl: '', fileUrl: '', fileName: '' },
          }));
          this.quizDrafts.update((current) => ({ ...current, [task.id]: {} }));
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
