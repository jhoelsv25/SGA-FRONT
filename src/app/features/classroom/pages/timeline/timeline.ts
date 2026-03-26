import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi } from '../../services/classroom-api';
import { ClassroomFeedComment, ClassroomFeedItem } from '../../types/classroom-types';
import { Toast } from '@core/services/toast';


@Component({
  selector: 'sga-classroom-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeline.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Timeline {
  public readonly store = inject(ClassroomStore);
  private readonly authFacade = inject(AuthFacade);
  private readonly api = inject(ClassroomApi);
  private readonly toast = inject(Toast);
  
  public postContent = signal('');
  public externalResourceUrl = signal('');
  public attachments = signal<{ url: string; name: string }[]>([]);
  public resourceMode = signal<'none' | 'file' | 'link'>('none');
  public isAssignment = signal(false);
  public expandedPostId = signal<string | null>(null);
  public commentDrafts = signal<Record<string, string>>({});
  public editingPostId = signal<string | null>(null);
  public editingPostContent = signal('');
  public editingCommentId = signal<string | null>(null);
  public editingCommentContent = signal('');
  public savingPostId = signal<string | null>(null);
  public deletingPostId = signal<string | null>(null);
  public savingCommentPostId = signal<string | null>(null);
  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly currentUser = computed(() => this.authFacade.getCurrentUser());
  readonly canPublish = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });
  readonly canComment = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director' || type === 'student';
  });
  readonly totalPosts = computed(() => this.store.feed().length);
  readonly assignmentCount = computed(() => this.store.feed().filter((item) => item.type === 'assignment').length);
  readonly materialCount = computed(() => this.store.feed().filter((item) => item.type === 'material').length);
  readonly postCount = computed(() => this.store.feed().filter((item) => item.type === 'post').length);

  onFileSelected(event: Event) {
    if (!this.canPublish()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.store.uploadFile(file, { category: 'classroom' }).subscribe({
        next: (res: { url: string; name: string }) => this.attachments.update(prev => [...prev, res]),
        error: (err) => console.error('Upload failed', err)
      });
      input.value = '';
    }
  }

  removeAttachment(idx: number) {
    this.attachments.update(prev => prev.filter((_, i) => i !== idx));
  }

  initials(name?: string) {
    return (name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'CL';
  }

  isExpanded(postId: string) {
    return this.expandedPostId() === postId;
  }

  toggleComments(postId: string) {
    this.expandedPostId.update((current) => (current === postId ? null : postId));
  }

  getCommentDraft(postId: string) {
    return this.commentDrafts()[postId] ?? '';
  }

  updateCommentDraft(postId: string, value: string) {
    this.commentDrafts.update((current) => ({ ...current, [postId]: value }));
  }

  canManagePost(item: ClassroomFeedItem) {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUser()?.id && item.author.id === this.currentUser()?.id);
  }

  canManageComment(comment: ClassroomFeedComment) {
    const type = this.profileType();
    if (type === 'admin' || type === 'director') return true;
    return Boolean(this.currentUser()?.id && comment.author.id === this.currentUser()?.id);
  }

  startEditPost(item: ClassroomFeedItem) {
    this.editingPostId.set(item.id);
    this.editingPostContent.set(item.content);
  }

  cancelEditPost() {
    this.editingPostId.set(null);
    this.editingPostContent.set('');
  }

  savePost(item: ClassroomFeedItem) {
    const sectionId = this.store.selectedSectionId();
    const content = this.editingPostContent().trim();
    if (!sectionId) return;
    if (!content && !(item.metadata.attachments?.length ?? 0)) {
      this.toast.error('La publicación no puede quedar vacía');
      return;
    }

    this.savingPostId.set(item.id);
    this.api
      .updatePost(sectionId, item.id, {
        content,
        attachmentUrl: item.metadata.attachments?.[0]?.url ?? null,
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

  deletePost(item: ClassroomFeedItem) {
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    this.deletingPostId.set(item.id);
    this.api.deletePost(sectionId, item.id).subscribe({
      next: () => {
        this.store.removeFeedItem(item.id);
        if (this.editingPostId() === item.id) this.cancelEditPost();
        if (this.expandedPostId() === item.id) this.expandedPostId.set(null);
        this.deletingPostId.set(null);
        this.toast.success('Publicación eliminada');
      },
      error: () => {
        this.deletingPostId.set(null);
        this.toast.error('No se pudo eliminar la publicación');
      },
    });
  }

  submitComment(postId: string) {
    const sectionId = this.store.selectedSectionId();
    const content = this.getCommentDraft(postId).trim();
    if (!sectionId || !content) return;

    this.savingCommentPostId.set(postId);
    this.api.createComment(sectionId, postId, content).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.updateCommentDraft(postId, '');
        this.expandedPostId.set(postId);
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

  saveComment(postId: string, commentId: string) {
    const sectionId = this.store.selectedSectionId();
    const content = this.editingCommentContent().trim();
    if (!sectionId || !content) return;

    this.api.updateComment(sectionId, postId, commentId, content).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.cancelEditComment();
        this.toast.success('Comentario actualizado');
      },
      error: () => this.toast.error('No se pudo actualizar el comentario'),
    });
  }

  deleteComment(postId: string, commentId: string) {
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    this.api.deleteComment(sectionId, postId, commentId).subscribe({
      next: (updated) => {
        this.store.replaceFeedItem(updated);
        this.toast.success('Comentario eliminado');
      },
      error: () => this.toast.error('No se pudo eliminar el comentario'),
    });
  }

  addExternalLink() {
    const value = this.externalResourceUrl().trim();
    if (!value) return;

    try {
      const parsed = new URL(value);
      const label = parsed.hostname.replace(/^www\./, '') || 'Recurso externo';
      this.attachments.update((prev) => [...prev, { url: value, name: label }]);
      this.externalResourceUrl.set('');
      this.resourceMode.set('none');
    } catch {
      console.error('Invalid external resource URL');
    }
  }

  publish() {
    if (!this.canPublish()) return;
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    if (this.postContent() || this.attachments().length > 0) {
      this.store.publishPost(this.postContent(), this.attachments().length ? this.attachments() : undefined)?.subscribe({
        next: () => {
          this.postContent.set('');
          this.externalResourceUrl.set('');
          this.attachments.set([]);
          this.resourceMode.set('none');
          this.isAssignment.set(false);
        }
      });
    }
  }
}
