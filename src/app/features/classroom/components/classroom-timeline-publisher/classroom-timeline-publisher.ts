import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';

@Component({
  selector: 'sga-classroom-timeline-publisher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classroom-timeline-publisher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTimelinePublisher {
  public readonly store = inject(ClassroomStore);
  private readonly authFacade = inject(AuthFacade);

  public postContent = signal('');
  public externalResourceUrl = signal('');
  public attachments = signal<{ url: string; name: string }[]>([]);
  public resourceMode = signal<'none' | 'file' | 'link'>('none');
  public isAssignment = signal(false);

  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly currentUser = computed(() => this.authFacade.getCurrentUser());
  
  readonly canPublish = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });

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
