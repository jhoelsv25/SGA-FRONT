import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassroomApi, type ClassroomTask } from '../../services/classroom-api';
import { Toast } from '@core/services/toast';

@Component({
  selector: 'sga-classroom-task-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classroom-task-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTaskItem {
  public task = input.required<ClassroomTask>();
  public sectionCourseId = input.required<string>();
  public canCreateTask = input<boolean>(false);
  public canSubmitTask = input<boolean>(false);
  public canInspectStudentSubmissions = input<boolean>(false);
  public canReviewTask = input<boolean>(false);
  public canCommentTask = input<boolean>(false);
  public profileType = input<string>('user');
  public currentUserId = input<string | null>(null);

  public onEdit = output<string>();
  public onDelete = output<ClassroomTask>();
  public onRefresh = output<void>();

  private readonly api = inject(ClassroomApi);
  private readonly toast = inject(Toast);

  // Local State
  public submitting = signal(false);
  public reviewingSubmissionId = signal<string | null>(null);
  public commentsExpanded = signal(false);
  
  public submissionDraft = signal({
    submissionText: '',
    linkUrl: '',
    fileUrl: '',
    fileName: '',
  });

  public quizDraft = signal<Record<string, { selectedOptionIds: string[]; answerText: string }>>({});
  public reviewDrafts = signal<Record<string, { score: string; feedback: string }>>({});
  public commentDraft = signal('');
  
  public editingCommentId = signal<string | null>(null);
  public editingCommentContent = signal('');
  public savingComment = signal(false);
  public deletingCommentId = signal<string | null>(null);

  statusLabel(status: ClassroomTask['status']) {
    if (status === 'graded') return 'Calificado';
    if (status === 'delivered') return 'Entregado';
    if (status === 'late') return 'Tardio';
    return 'Pendiente';
  }

  isQuiz(task: ClassroomTask) {
    return task.type === 'quiz';
  }

  toggleComments() {
    this.commentsExpanded.update(v => !v);
  }

  // Quiz methods
  getQuizQuestionDraft(questionId: string) {
    return this.quizDraft()[questionId] ?? { selectedOptionIds: [], answerText: '' };
  }

  updateQuizAnswer(questionId: string, patch: { selectedOptionIds?: string[]; answerText?: string }) {
    this.quizDraft.update(current => ({
      ...current,
      [questionId]: { ...this.getQuizQuestionDraft(questionId), ...patch }
    }));
  }

  toggleQuizOption(questionId: string, optionId: string, multiple: boolean) {
    const current = this.getQuizQuestionDraft(questionId).selectedOptionIds;
    const next = multiple
      ? current.includes(optionId)
        ? current.filter(id => id !== optionId)
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
        this.submissionDraft.update(current => ({ ...current, fileUrl: res.url, fileName: res.name }));
      },
      error: () => this.toast.error('No se pudo subir el archivo'),
    });
  }

  submitTask() {
    const sectionCourseId = this.sectionCourseId();
    const task = this.task();
    const draft = this.submissionDraft();
    const isQuiz = this.isQuiz(task);
    
    const answers = (task.questions ?? []).map((q) => {
      const draftQ = this.getQuizQuestionDraft(q.id);
      return { questionId: q.id, selectedOptionIds: draftQ.selectedOptionIds, answerText: draftQ.answerText };
    });

    if (isQuiz && !answers.some(a => a.selectedOptionIds.length || a.answerText.trim())) {
      this.toast.error('Responde al menos una pregunta del quiz');
      return;
    }

    if (!isQuiz && !draft.submissionText && !draft.linkUrl && !draft.fileUrl) {
      this.toast.error('Agrega texto, enlace o archivo para entregar');
      return;
    }

    this.submitting.set(true);
    this.api.submitTask(sectionCourseId, task.id, {
      submissionText: isQuiz ? undefined : draft.submissionText || undefined,
      linkUrl: isQuiz ? undefined : draft.linkUrl || undefined,
      fileUrl: isQuiz ? undefined : draft.fileUrl || undefined,
      fileName: isQuiz ? undefined : draft.fileName || undefined,
      answers: isQuiz ? answers : undefined,
    }).subscribe({
      next: (result) => {
        this.toast.success(result.score !== undefined ? `Quiz enviado. Puntaje: ${result.score}` : 'Entrega registrada');
        this.submissionDraft.set({ submissionText: '', linkUrl: '', fileUrl: '', fileName: '' });
        this.quizDraft.set({});
        this.onRefresh.emit();
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
    this.reviewDrafts.update(current => ({
      ...current,
      [submissionId]: { ...this.getReviewDraft(submissionId), ...patch }
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
    this.api.reviewTaskSubmission(this.sectionCourseId(), this.task().id, submissionId, {
      score,
      feedback: draft.feedback || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Entrega calificada');
        this.onRefresh.emit();
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
    this.api.createTaskComment(this.sectionCourseId(), this.task().id, content).subscribe({
      next: () => {
        this.commentDraft.set('');
        this.commentsExpanded.set(true);
        this.onRefresh.emit();
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
    this.api.updateTaskComment(this.sectionCourseId(), this.task().id, commentId, content).subscribe({
      next: () => {
        this.cancelEditComment();
        this.onRefresh.emit();
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
    this.api.deleteTaskComment(this.sectionCourseId(), this.task().id, commentId).subscribe({
      next: () => {
        this.onRefresh.emit();
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
