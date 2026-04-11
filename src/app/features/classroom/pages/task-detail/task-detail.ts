import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Toast } from '@core/services/toast';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';
import { ClassroomSocketService } from '../../services/classroom-socket';
import { ClassroomStore } from '../../services/store/classroom.store';

@Component({
  selector: 'sga-classroom-task-detail',

  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TaskDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClassroomStore);
  private readonly api = inject(ClassroomApi);
  private readonly socket = inject(ClassroomSocketService);
  private readonly authFacade = inject(AuthFacade);
  private readonly toast = inject(Toast);
  private readonly destroy$ = new Subject<void>();

  public task = signal<ClassroomTask | null>(null);
  public sectionCourseId = signal('');
  public taskId = signal('');
  public loading = signal(true);

  // Profile data
  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly currentUserId = computed(() => this.authFacade.getCurrentUser()?.id ?? null);

  // Permissions (Same as TaskItem)
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

  // Local State for Submission/Quiz/Comments
  public submitting = signal(false);
  public reviewDrafts = signal<Record<string, { score: string; feedback: string }>>({});
  public reviewingSubmissionId = signal<string | null>(null);
  public submissionDraft = signal({
    submissionText: '',
    linkUrl: '',
    fileUrl: '',
    fileName: '',
  });
  public quizDraft = signal<Record<string, { selectedOptionIds: string[]; answerText: string }>>(
    {},
  );
  public commentDraft = signal('');
  public savingComment = signal(false);
  public editingCommentId = signal<string | null>(null);
  public editingCommentContent = signal('');
  public deletingCommentId = signal<string | null>(null);

  ngOnInit(): void {
    const sectionId =
      this.store.selectedSectionId() ??
      this.route.parent?.parent?.snapshot.paramMap.get('id') ??
      '';
    const taskId = this.route.snapshot.paramMap.get('taskId') ?? '';

    if (sectionId && taskId) {
      this.sectionCourseId.set(sectionId);
      this.taskId.set(taskId);
      this.socket.taskEvent$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        if (event.action === 'deleted' && event.id === this.taskId()) {
          this.task.set(null);
          return;
        }

        if (event.action === 'updated' && event.task?.id === this.taskId()) {
          this.task.set(event.task);
        }
      });
      this.loadTask();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTask() {
    this.loading.set(true);
    // Assuming backend has a getTaskById or we reuse getTasks and filter
    // Actually, ClassroomApi.getTasks returns an array, let's see if there's a specific one
    this.api.getTasks(this.sectionCourseId()).subscribe({
      next: (list) => {
        const found = list.find((t) => t.id === this.taskId());
        this.task.set(found || null);
        this.loading.set(false);
      },
      error: () => {
        this.task.set(null);
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: ClassroomTask['status'] | undefined) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

  isQuiz(task: ClassroomTask) {
    return task.type === 'quiz';
  }

  // Quiz methods
  getQuizQuestionDraft(questionId: string) {
    return this.quizDraft()[questionId] ?? { selectedOptionIds: [], answerText: '' };
  }

  updateQuizAnswer(
    questionId: string,
    patch: { selectedOptionIds?: string[]; answerText?: string },
  ) {
    this.quizDraft.update((current) => ({
      ...current,
      [questionId]: { ...this.getQuizQuestionDraft(questionId), ...patch },
    }));
  }

  toggleQuizOption(questionId: string, optionId: string, multiple: boolean) {
    const current = this.getQuizQuestionDraft(questionId).selectedOptionIds;
    const next = multiple
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : [optionId];
    this.updateQuizAnswer(questionId, { selectedOptionIds: next });
  }

  // Submission methods
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.api.uploadFile(file).subscribe({
      next: (res) => {
        this.submissionDraft.update((current) => ({
          ...current,
          fileUrl: res.url,
          fileName: res.name,
        }));
      },
      error: () => this.toast.error('No se pudo subir el archivo'),
    });
  }

  submitTask() {
    const currentTask = this.task();
    if (!currentTask) return;

    const sectionCourseId = this.sectionCourseId();
    const draft = this.submissionDraft();
    const isQuiz = this.isQuiz(currentTask);

    const answers = (currentTask.questions ?? []).map((q) => {
      const draftQ = this.getQuizQuestionDraft(q.id);
      return {
        questionId: q.id,
        selectedOptionIds: draftQ.selectedOptionIds,
        answerText: draftQ.answerText,
      };
    });

    if (isQuiz && !answers.some((a) => a.selectedOptionIds.length || a.answerText.trim())) {
      this.toast.error('Responde al menos una pregunta del quiz');
      return;
    }

    if (!isQuiz && !draft.submissionText && !draft.linkUrl && !draft.fileUrl) {
      this.toast.error('Agrega texto, enlace o archivo para entregar');
      return;
    }

    this.submitting.set(true);
    this.api
      .submitTask(sectionCourseId, currentTask.id, {
        submissionText: isQuiz ? undefined : draft.submissionText || undefined,
        linkUrl: isQuiz ? undefined : draft.linkUrl || undefined,
        fileUrl: isQuiz ? undefined : draft.fileUrl || undefined,
        fileName: isQuiz ? undefined : draft.fileName || undefined,
        answers: isQuiz ? answers : undefined,
      })
      .subscribe({
        next: (result) => {
          this.toast.success(
            result.score !== undefined
              ? `Quiz enviado. Puntaje: ${result.score}`
              : 'Entrega registrada',
          );
          this.submissionDraft.set({ submissionText: '', linkUrl: '', fileUrl: '', fileName: '' });
          this.quizDraft.set({});
          this.loadTask();
          this.submitting.set(false);
        },
        error: () => {
          this.toast.error('No se pudo registrar la entrega');
          this.submitting.set(false);
        },
      });
  }

  // Review methods
  getReviewDraft(submissionId: string) {
    return this.reviewDrafts()[submissionId] ?? { score: '', feedback: '' };
  }

  updateReviewDraft(submissionId: string, patch: Partial<{ score: string; feedback: string }>) {
    this.reviewDrafts.update((current) => ({
      ...current,
      [submissionId]: { ...this.getReviewDraft(submissionId), ...patch },
    }));
  }

  reviewSubmission(submissionId: string) {
    const draft = this.getReviewDraft(submissionId);
    const score = Number(draft.score);
    if (Number.isNaN(score)) {
      this.toast.error('Ingresa un puntaje valido');
      return;
    }

    this.reviewingSubmissionId.set(submissionId);
    this.api
      .reviewTaskSubmission(this.sectionCourseId(), this.taskId(), submissionId, {
        score,
        feedback: draft.feedback || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Entrega calificada');
          this.loadTask();
          this.reviewingSubmissionId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo calificar la entrega');
          this.reviewingSubmissionId.set(null);
        },
      });
  }

  // Comment methods
  canManageComment(comment: any) {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUserId() && comment.author.id === this.currentUserId());
  }

  startEditComment(comment: any) {
    this.editingCommentId.set(comment.id);
    this.editingCommentContent.set(comment.content);
  }

  cancelEditComment() {
    this.editingCommentId.set(null);
    this.editingCommentContent.set('');
  }

  submitComment() {
    const content = this.commentDraft().trim();
    if (!content) return;

    this.savingComment.set(true);
    this.api.createTaskComment(this.sectionCourseId(), this.taskId(), content).subscribe({
      next: () => {
        this.commentDraft.set('');
        this.loadTask();
        this.savingComment.set(false);
        this.toast.success('Comentario agregado');
      },
      error: () => {
        this.savingComment.set(false);
        this.toast.error('No se pudo registrar el comentario');
      },
    });
  }

  saveCommentUpdate(commentId: string) {
    const content = this.editingCommentContent().trim();
    if (!content) return;

    this.savingComment.set(true);
    this.api
      .updateTaskComment(this.sectionCourseId(), this.taskId(), commentId, content)
      .subscribe({
        next: () => {
          this.cancelEditComment();
          this.loadTask();
          this.savingComment.set(false);
          this.toast.success('Comentario actualizado');
        },
        error: () => {
          this.savingComment.set(false);
          this.toast.error('No se pudo actualizar el comentario');
        },
      });
  }

  deleteComment(commentId: string) {
    this.deletingCommentId.set(commentId);
    this.api.deleteTaskComment(this.sectionCourseId(), this.taskId(), commentId).subscribe({
      next: () => {
        this.loadTask();
        this.deletingCommentId.set(null);
        this.toast.success('Comentario eliminado');
      },
      error: () => {
        this.deletingCommentId.set(null);
        this.toast.error('No se pudo eliminar el comentario');
      },
    });
  }
}
