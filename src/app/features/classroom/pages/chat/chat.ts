import { AfterViewInit, ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassroomStore } from '../../services/store/classroom.store';
import { AuthStore } from '@auth/services/store/auth.store';
import type { ChatMessage } from '../../types/classroom-types';
import { ClassroomApi } from '../../services/classroom-api';


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
  private readonly api = inject(ClassroomApi);
  public readonly floating = input(false);
  public readonly requestClose = output<void>();
  public newMessage = signal('');
  public sending = signal(false);
  public isComposerFocused = signal(false);
  private preserveScrollOnHistoryLoad = false;

  @ViewChild('chatScrollViewport')
  private chatScrollViewport?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const messagesLength = this.store.chatMessages().length;
      const isLoadingHistory = this.store.chatLoadingMore();
      if (!messagesLength || isLoadingHistory || this.preserveScrollOnHistoryLoad) return;

      queueMicrotask(() => this.scrollToBottom());
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.scrollToBottom());
    queueMicrotask(() => {
      const sectionId = this.store.selectedSectionId();
      if (!sectionId) return;
      this.api.markChatAsRead(sectionId).subscribe({ error: () => void 0 });
    });
  }

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
        queueMicrotask(() => this.scrollToBottom());
      },
      error: () => this.sending.set(false),
    });
  }

  onMessagesScroll(event: Event): void {
    const target = event.target as HTMLDivElement | null;
    if (!target || target.scrollTop > 80 || !this.store.chatHasNext()) return;

    const previousHeight = target.scrollHeight;
    const previousTop = target.scrollTop;
    const obs = this.store.loadOlderMessages();
    if (!obs) return;

    this.preserveScrollOnHistoryLoad = true;
    obs.subscribe({
      next: (loadedCount) => {
        if (!loadedCount) {
          this.preserveScrollOnHistoryLoad = false;
          return;
        }
        queueMicrotask(() => {
          target.scrollTop = target.scrollHeight - previousHeight + previousTop;
          this.preserveScrollOnHistoryLoad = false;
        });
      },
      error: () => {
        this.preserveScrollOnHistoryLoad = false;
      },
    });
  }

  private scrollToBottom(): void {
    const viewport = this.chatScrollViewport?.nativeElement;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }
}
