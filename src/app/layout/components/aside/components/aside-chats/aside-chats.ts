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
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ClassroomApi } from '@features/classroom/services/classroom-api';
import type { ChatInboxItem } from '@features/classroom/types/classroom-types';
import { ChatInboxSocketService } from '@core/services/chat-inbox-socket.service';
import { LayoutStore } from '@core/stores/layout.store';

@Component({
  selector: 'sga-aside-chats',

  imports: [CommonModule, FormsModule, ZardIconComponent, ZardBadgeComponent, ZardEmptyComponent],
  template: `
    <div class="flex flex-col h-full bg-card/10 backdrop-blur-3xl overflow-hidden">
      <div class="p-6 border-b border-border/5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Mensajes del aula
          </h3>
          <div
            class="rounded-xl bg-primary/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-primary"
          >
            {{ chats().length }}
          </div>
        </div>
        <div class="relative group/box">
          <z-icon
            zType="search"
            class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/box:text-primary transition-colors"
          />
          <input
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Buscar aula o mensaje..."
            class="w-full h-12 rounded-2xl border border-border/5 bg-muted/20 pl-12 pr-4 text-xs transition-all placeholder:text-[10px] placeholder:font-bold placeholder:uppercase placeholder:tracking-widest focus:border-primary/20 focus:outline-none"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-1" id="chat-list" (scroll)="onScroll($event)">
        @for (chat of filteredChats(); track chat.id) {
          <button
            type="button"
            class="w-full group p-4 rounded-3xl hover:bg-card/40 border border-transparent hover:border-border/5 transition-all duration-300 cursor-pointer flex items-center gap-4 relative overflow-hidden text-left"
            [class.bg-primary/5]="chat.unread"
            (click)="openChat(chat)"
          >
            @if (chat.unread) {
              <div class="absolute inset-0 bg-primary/5 animate-pulse opacity-50"></div>
            }

            <div class="relative shrink-0">
              @if (chat.avatar) {
                <div
                  class="size-14 rounded-[1.25rem] bg-linear-to-tr from-primary/10 to-primary/5 border border-primary/20 p-1 group-hover:scale-110 transition-transform duration-500 overflow-hidden"
                >
                  <img
                    [src]="chat.avatar"
                    [alt]="chat.name"
                    class="w-full h-full object-cover rounded-2xl shadow-sm"
                  />
                </div>
              } @else {
                <div
                  class="size-14 rounded-[1.25rem] bg-linear-to-tr from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-black uppercase text-primary group-hover:scale-110 transition-transform duration-500"
                >
                  {{ initials(chat) }}
                </div>
              }
            </div>

            <div class="flex-1 min-w-0 space-y-1 relative z-10">
              <div class="flex items-center justify-between gap-3">
                <h4
                  class="text-xs font-black text-foreground uppercase tracking-tight inter truncate group-hover:text-primary transition-colors"
                >
                  {{ chat.name }}
                </h4>
                <span
                  class="text-[8px] font-bold text-muted-foreground opacity-40 uppercase tracking-tighter"
                >
                  {{ displayTime(chat.time) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <p
                  class="text-[11px] text-muted-foreground truncate leading-snug"
                  [class.font-bold]="chat.unread"
                  [class.text-foreground/80]="chat.unread"
                >
                  {{ chat.lastMessage }}
                </p>
                @if (chat.unreadCount) {
                  <z-badge
                    class="rounded-full bg-primary text-primary-foreground min-w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold ring-2 ring-primary/20"
                  >
                    {{ chat.unreadCount }}
                  </z-badge>
                }
              </div>
            </div>
          </button>
        } @empty {
          @if (!loading()) {
            <div class="h-full flex flex-col items-center justify-center py-20 opacity-40">
              <z-empty
                [zIcon]="'chat'"
                zTitle="Sin conversaciones"
                zDescription="Cuando haya actividad en tus aulas, aparecerá aquí."
              />
            </div>
          }
        }

        @if (loading()) {
          <div class="py-4 flex justify-center">
            <z-icon zType="loader-circle" class="size-6 text-primary animate-spin" />
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      #chat-list::-webkit-scrollbar {
        width: 4px;
      }
      #chat-list::-webkit-scrollbar-thumb {
        background: var(--primary-muted);
        border-radius: 10px;
      }
      #chat-list {
        scrollbar-width: thin;
        scrollbar-color: var(--primary-muted) transparent;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideChats implements OnInit, OnDestroy {
  private readonly api = inject(ClassroomApi);
  private readonly router = inject(Router);
  private readonly socket = inject(ChatInboxSocketService);
  private readonly layout = inject(LayoutStore);
  private readonly destroy$ = new Subject<void>();

  readonly chats = signal<ChatInboxItem[]>([]);
  readonly query = signal('');
  readonly loading = signal(false);
  readonly nextCursor = signal<{ date: string; id: string } | null>(null);
  readonly hasNext = signal(false);

  readonly filteredChats = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return this.chats();

    return this.chats().filter((chat) =>
      [chat.name, chat.lastMessage].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(term),
      ),
    );
  });

  ngOnInit(): void {
    this.loadInitial();
    this.socket.connect();
    this.socket.inboxUpdate$.pipe(takeUntil(this.destroy$)).subscribe((incoming) => {
      const current = this.chats().filter((item) => item.id !== incoming.id);
      this.chats.set([incoming, ...current]);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.disconnect();
  }

  loadInitial(): void {
    this.loading.set(true);
    this.api.getChatInbox({ limit: 12 }).subscribe({
      next: (response) => {
        this.chats.set(response.data ?? []);
        this.nextCursor.set(response.nextCursor);
        this.hasNext.set(response.hasNext);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || !this.hasNext()) return;

    this.loading.set(true);
    this.api
      .getChatInbox({
        cursorDate: cursor.date,
        cursorId: cursor.id,
        limit: 12,
      })
      .subscribe({
        next: (response) => {
          const existingIds = new Set(this.chats().map((item) => item.id));
          const merged = [
            ...this.chats(),
            ...(response.data ?? []).filter((item) => !existingIds.has(item.id)),
          ];
          this.chats.set(merged);
          this.nextCursor.set(response.nextCursor);
          this.hasNext.set(response.hasNext);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 80) {
      this.loadMore();
    }
  }

  openChat(chat: ChatInboxItem): void {
    this.chats.update((items) =>
      items.map((item) =>
        item.id === chat.id ? { ...item, unread: false, unreadCount: 0 } : item,
      ),
    );
    this.router.navigateByUrl(chat.route);
    this.layout.closeAside();
  }

  initials(chat: ChatInboxItem): string {
    return (
      chat.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?'
    );
  }

  displayTime(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }
}
