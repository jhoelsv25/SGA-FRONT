import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomSocketService } from '../../services/classroom-socket';

@Component({
  selector: 'sga-classroom-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Input],
  templateUrl: './timeline.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Timeline {
  public readonly store = inject(ClassroomStore);
  private readonly socket = inject(ClassroomSocketService);
  
  public postContent = signal('');
  public attachments = signal<{ url: string; name: string }[]>([]);
  public isAssignment = signal(false);

  public mockFeed = [
    {
      id: '1',
      type: 'post',
      title: 'Bienvenidos al curso',
      content: 'Hola a todos, este es el muro de nuestra clase. Aquí publicaré novedades y materiales.',
      date: new Date().toISOString(),
      author: { name: 'Prof. Juan Lopez', role: 'Docente', avatar: 'JL' },
      metadata: { attachments: [] },
      commentsCount: 3
    }
  ];

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
        next: (res: { id: string }) => {
          this.socket.notifyNewPost(sectionId, {
            ...res,
            type: this.isAssignment() ? 'assignment' : 'post',
            metadata: { attachments: this.attachments() },
            author: { name: 'Yo', role: 'Docente' }
          });
          
          this.postContent.set('');
          this.attachments.set([]);
          this.isAssignment.set(false);
        }
      });
    }
  }
}
