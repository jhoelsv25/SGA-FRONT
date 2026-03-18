import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '@core/stores/notification.store';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';

@Component({
  selector: 'sga-aside-notifications',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, ZardButtonComponent, ZardEmptyComponent],
  template: `
    <div class="flex flex-col h-full bg-card/10 backdrop-blur-xl">
      <!-- HEADER ACTIONS -->
      <div class="p-4 flex items-center justify-between border-b border-border/5">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Recientes
        </h3>
        <button
          z-button
          zType="ghost"
          zSize="xs"
          class="text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
        >
          Marcar todo como leído
        </button>
      </div>

      <!-- LIST -->
      <div
        class="flex-1 overflow-y-auto p-4 space-y-3"
        id="noti-scroll"
        (scroll)="onScroll($event)"
      >
        @for (notification of store.data(); track notification.id) {
          <div
            class="group p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden"
            [class.bg-card]="notification.isRead"
            [class.bg-primary/5]="!notification.isRead"
            [class.border-border/5]="notification.isRead"
            [class.border-primary/20]="!notification.isRead"
            [class.shadow-lg]="!notification.isRead"
            (click)="markRead(notification.id)"
          >
            <!-- Unread Indicator -->
            @if (!notification.isRead) {
              <div class="absolute top-0 right-0 size-2 bg-primary rounded-bl-lg shadow-sm"></div>
            }

            <div class="flex gap-4 relative z-10">
              <div
                class="shrink-0 size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner"
              >
                <z-icon [zType]="getIcon(notification.type)" class="size-5" />
              </div>
              <div class="flex-1 space-y-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4
                    class="text-xs font-black text-foreground truncate uppercase tracking-tight inter"
                  >
                    {{ notification.title }}
                  </h4>
                  <span class="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                    {{ notification.createdAt | date: 'HH:mm' }}
                  </span>
                </div>
                <p class="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {{ notification.content }}
                </p>
                <div
                  class="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span class="text-[8px] font-black tracking-widest text-primary uppercase"
                    >Ver detalles</span
                  >
                  <z-icon zType="arrow-right" class="size-2.5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        } @empty {
          @if (!store.loading()) {
            <div class="h-full flex flex-col items-center justify-center py-20 opacity-40">
              <z-empty
                zIcon="bell"
                zTitle="Sin novedades"
                zDescription="No tienes notificaciones pendientes en este momento."
              />
            </div>
          }
        }

        @if (store.loading()) {
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
      #noti-scroll {
        scrollbar-width: thin;
        scrollbar-color: var(--border) transparent;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideNotifications implements OnInit {
  public store = inject(NotificationStore);

  ngOnInit() {
    this.store.loadInitial();
  }

  onScroll(event: any) {
    const el = event.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      this.store.loadMore();
    }
  }

  markRead(id: string) {
    this.store.markAsRead(id);
  }

  getIcon(type: string): any {
    switch (type) {
      case 'CHAT':
        return 'message-circle';
      case 'SYSTEM':
        return 'shield';
      case 'ACADEMIC':
        return 'graduation-cap';
      default:
        return 'bell';
    }
  }
}
