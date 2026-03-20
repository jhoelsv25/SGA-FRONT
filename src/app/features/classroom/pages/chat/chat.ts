import { ChangeDetectionStrategy, Component, inject, signal, input, output } from '@angular/core';
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
  public readonly floating = input(false);
  public readonly requestClose = output<void>();
  public newMessage = signal('');
  public sending = signal(false);
  public isComposerFocused = signal(false);

  isMe(msg: ChatMessage): boolean {
    const user = this.authStore.currentUser();
    return user?.id != null && msg.senderId === user.id;
  }

  displayTimestamp(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
    return value;
  }

  displayName(msg: ChatMessage): string {
    if (msg.senderName?.trim()) return msg.senderName.trim();
    return this.isMe(msg) ? 'Tú' : 'Usuario';
  }

  initials(msg: ChatMessage): string {
    const source = this.displayName(msg)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
    return source || '?';
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
