import { ChangeDetectionStrategy, Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassroomStore } from '../../services/store/classroom.store';
import { AuthStore } from '@auth/services/store/auth.store';
import type { ChatMessage } from '../../types/classroom-types';


@Component({
  selector: 'sga-classroom-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Chat {
  public readonly store = inject(ClassroomStore);
  public readonly authStore = inject(AuthStore);
  public newMessage = signal('');
  public sending = signal(false);
  public isComposerFocused = signal(false);

  isMe(msg: ChatMessage): boolean {
    const user = this.authStore.currentUser();
    return user?.id != null && msg.senderId === user.id;
  }

  sendMessage(): void {
    const content = this.newMessage().trim();
    if (!content || this.sending()) return;
    const obs = this.store.sendMessage(content);
    if (!obs) return;
    this.sending.set(true);
    obs.subscribe({
      next: () => {
        this.newMessage.set('');
        this.sending.set(false);
      },
      error: () => this.sending.set(false),
    });
  }
}
