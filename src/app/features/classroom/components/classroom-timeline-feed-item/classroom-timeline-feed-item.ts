import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi } from '../../services/classroom-api';
import { ClassroomFeedComment, ClassroomFeedItem } from '../../types/classroom-types';
import { Toast } from '@core/services/toast';

@Component({
  selector: 'sga-classroom-timeline-feed-item',
  standalone: true,
  host: {
    class: 'block pb-5 last:pb-0',
  },
  imports: [CommonModule, FormsModule],
  templateUrl: './classroom-timeline-feed-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTimelineFeedItem {
  public item = input.required<ClassroomFeedItem>();
  
  public readonly store = inject(ClassroomStore);
  private readonly authFacade = inject(AuthFacade);
  private readonly api = inject(ClassroomApi);
  private readonly toast = inject(Toast);

  public expanded = signal(false);
  public commentDraft = signal('');
  public editingPostId = signal<string | null>(null);
  public editingPostContent = signal('');
  public editingCommentId = signal<string | null>(null);
  public editingCommentContent = signal('');
  public savingPostId = signal<string | null>(null);
  public deletingPostId = signal<string | null>(null);
  public savingCommentPostId = signal<string | null>(null);

  readonly attachments = computed(() => this.item().metadata?.attachments ?? []);

  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly currentUser = computed(() => this.authFacade.getCurrentUser());

  readonly canComment = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'student';
  });

  initials(name?: string) {
    return (name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'CL';
  }

  isExpanded() {
    return this.expanded();
  }

  toggleComments() {
    this.expanded.update((v) => !v);
  }

  canManagePost() {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUser()?.id && this.item().author.id === this.currentUser()?.id);
  }

  canManageComment(comment: ClassroomFeedComment) {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUser()?.id && comment.author.id === this.currentUser()?.id);
  }

  startEditPost() {
    this.editingPostId.set(this.item().id);
    this.editingPostContent.set(this.item().content);
  }

  cancelEditPost() {
    this.editingPostId.set(null);
    this.editingPostContent.set('');
  }

  savePost() {
    const sectionId = this.store.selectedSectionId();
    const content = this.editingPostContent().trim();
    if (!sectionId) return;
    if (!content && !this.attachments().length) {
      this.toast.error('La publicación no puede quedar vacía');
      return;
    }

    this.savingPostId.set(this.item().id);
    this.api
      .updatePost(sectionId, this.item().id, {
        content,
        attachmentUrl: this.attachments()[0]?.url ?? null,
      })
      .subscribe({
        next: (updated) => {
          this.store.replaceFeedItem(updated);
          this.cancelEditPost();
          this.savingPostId.set(null);
          this.toast.success('Publicación actualizada');
        },
        error: () => {
          this.savingPostId.set(null);
          this.toast.error('No se pudo actualizar la publicación');
        },
      });
  }

  deletePost() {
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    this.deletingPostId.set(this.item().id);
    this.api.deletePost(sectionId, this.item().id).subscribe({
      next: () => {
        this.store.removeFeedItem(this.item().id);
        if (this.editingPostId() === this.item().id) this.cancelEditPost();
        this.deletingPostId.set(null);
        this.toast.success('Publicación eliminada');
      },
      error: () => {
        this.deletingPostId.set(null);
        this.toast.error('No se pudo eliminar la publicación');
      },
    });
  }

  submitComment() {
    const sectionId = this.store.selectedSectionId();
    const content = this.commentDraft().trim();
    if (!sectionId || !content) return;

    this.savingCommentPostId.set(this.item().id);
    this.api.createComment(sectionId, this.item().id, content).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.commentDraft.set('');
        this.expanded.set(true);
        this.savingCommentPostId.set(null);
        this.toast.success('Comentario agregado');
      },
      error: () => {
        this.savingCommentPostId.set(null);
        this.toast.error('No se pudo registrar el comentario');
      },
    });
  }

  startEditComment(comment: ClassroomFeedComment) {
    this.editingCommentId.set(comment.id);
    this.editingCommentContent.set(comment.content);
  }

  cancelEditComment() {
    this.editingCommentId.set(null);
    this.editingCommentContent.set('');
  }

  saveComment(commentId: string) {
    const sectionId = this.store.selectedSectionId();
    const content = this.editingCommentContent().trim();
    if (!sectionId || !content) return;

    this.api.updateComment(sectionId, this.item().id, commentId, content).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.cancelEditComment();
        this.toast.success('Comentario actualizado');
      },
      error: () => this.toast.error('No se pudo actualizar el comentario'),
    });
  }

  deleteComment(commentId: string) {
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    this.api.deleteComment(sectionId, this.item().id, commentId).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.toast.success('Comentario eliminado');
      },
      error: () => this.toast.error('No se pudo eliminar el comentario'),
    });
  }
}
