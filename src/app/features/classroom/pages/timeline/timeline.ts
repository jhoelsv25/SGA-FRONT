import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/adapters/ui/input/input';
import { Textarea } from '@shared/widgets/ui/textarea/textarea';
import { Card } from '@shared/adapters/ui/card/card';
import { Skeleton } from '@shared/widgets/ui/skeleton/skeleton';
import { ClassroomStore } from '../../services/store/classroom.store';

@Component({
  selector: 'sga-classroom-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Input, Textarea, Card, Skeleton],
  templateUrl: './timeline.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Timeline {
  public readonly store = inject(ClassroomStore);
  
  public postContent = signal('');
  public attachments = signal<{ url: string; name: string }[]>([]);
  public isAssignment = signal(false);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.store.uploadFile(file).subscribe({
        next: (res: { url: string; name: string }) => this.attachments.update(prev => [...prev, res]),
        error: (err) => console.error('Upload failed', err)
      });
    }
  }

  removeAttachment(idx: number) {
    this.attachments.update(prev => prev.filter((_, i) => i !== idx));
  }

  publish() {
    const sectionId = this.store.selectedSectionId();
    if (!sectionId) return;

    if (this.postContent() || this.attachments().length > 0) {
      const urls = this.attachments().map((a) => a.url);
      this.store.publishPost(this.postContent(), urls.length ? urls : undefined)?.subscribe({
        next: () => {
          this.postContent.set('');
          this.attachments.set([]);
          this.isAssignment.set(false);
        }
      });
    }
  }
}
