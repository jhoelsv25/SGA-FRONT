import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStore } from '@core/stores/notification.store';
import { LayoutStore } from '@core/stores/layout.store';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';

@Component({
  selector: 'sga-aside-notifications',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, ZardButtonComponent, ZardEmptyComponent],
  template: `
    <div class="flex h-full min-h-0 flex-col bg-card/10 backdrop-blur-xl">
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
          (click)="markAllRead()"
        >
          Marcar todo como leído
        </button>
      </div>

      <!-- LIST -->
      <div
        class="notification-list flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
        id="noti-scroll"
        (scroll)="onScroll($event)"
      >
        @for (notification of store.data(); track notification.id) {
          <div
            class="group relative cursor-pointer overflow-hidden rounded-[1.6rem] border p-4 transition-all duration-300"
            [class.bg-card]="notification.isRead"
            [class.bg-primary/6]="!notification.isRead"
            [class.border-border/5]="notification.isRead"
            [class.border-primary/20]="!notification.isRead"
            [class.shadow-lg]="!notification.isRead"
            [class.hover:-translate-y-0.5]="true"
            [class.hover:shadow-xl]="true"
            (click)="openNotification(notification)"
          >
            <div
              class="absolute inset-0 opacity-90"
              class="bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.05),transparent_35%)]"
            ></div>

            <!-- Unread Indicator -->
            @if (!notification.isRead) {
              <div class="absolute top-0 right-0 size-2 bg-primary rounded-bl-lg shadow-sm"></div>
            }

            <div class="relative z-10 flex gap-4">
              <div class="relative shrink-0">
                @if (notification.metadata?.sender?.avatarUrl) {
                  <img
                    [src]="notification.metadata?.sender?.avatarUrl!"
                    [alt]="notification.metadata?.sender?.name || 'Remitente'"
                    class="size-11 rounded-2xl object-cover shadow-inner"
                  />
                } @else {
                  <div
                    class="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-inner"
                  >
                    <span class="text-[11px] font-black">
                      {{ senderInitials(notification) }}
                    </span>
                  </div>
                }

                <div
                  class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-primary/12 text-primary shadow-sm dark:border-neutral-950"
                >
                  <z-icon [zType]="getIcon(notification.type)" class="size-3" />
                </div>
              </div>
              <div class="flex-1 space-y-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                    {{ notification.createdAt | date: 'HH:mm' }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-[10px]">
                  <span class="font-bold text-foreground/80">{{ senderName(notification) }}</span>
                  <span class="text-muted-foreground/45">•</span>
                  <span class="rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-semibold text-primary/80">
                    {{ senderRole(notification) }}
                  </span>
                  <span class="rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-semibold text-primary/80">
                    {{ priorityLabel(notification.priority) }}
                  </span>
                </div>
                <h4
                  class="line-clamp-2 pr-3 text-[0.82rem] font-black uppercase tracking-tight text-foreground"
                >
                  {{ notification.title }}
                </h4>
                <p class="line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                  {{ notification.content }}
                </p>
                <div
                  class="flex items-center gap-2 pt-1 transition-opacity opacity-0 group-hover:opacity-100"
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
      .notification-list {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
      }
      #noti-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
      }
      #noti-scroll::-webkit-scrollbar {
        width: 8px;
      }
      #noti-scroll::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.45);
        border-radius: 999px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideNotifications {
  public store = inject(NotificationStore);
  private readonly router = inject(Router);
  private readonly layout = inject(LayoutStore);

  onScroll(event: any) {
    const el = event.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      this.store.loadMore();
    }
  }

  markRead(id: string) {
    this.store.markAsRead(id);
  }

  openNotification(notification: any) {
    this.markRead(notification.id);

    if (notification.linkUrl) {
      this.router.navigateByUrl(notification.linkUrl);
      this.layout.closeAside();
    }
  }

  markAllRead() {
    this.store.markAllAsRead();
  }

  getIcon(type: string): any {
    switch ((type || '').toLowerCase()) {
      case 'alert':
      case 'error':
        return 'triangle-alert';
      case 'warning':
        return 'shield';
      case 'success':
        return 'circle-check';
      case 'info':
        return 'graduation-cap';
      default:
        return 'bell';
    }
  }

  senderName(notification: any): string {
    return notification?.metadata?.sender?.name || 'Sistema SISAE';
  }

  senderRole(notification: any): string {
    return notification?.metadata?.sender?.role || 'Sistema';
  }

  senderInitials(notification: any): string {
    return this.senderName(notification)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  priorityLabel(priority?: string): string {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  }
}
