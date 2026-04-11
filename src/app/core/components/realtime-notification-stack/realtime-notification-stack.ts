import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Notification } from '@core/services/api/notification-api';
import { NotificationStore } from '@core/stores/notification.store';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent, type ZardIcon } from '@/shared/components/icon';

@Component({
  selector: 'sga-realtime-notification-stack',

  imports: [CommonModule, DatePipe, ZardButtonComponent, ZardIconComponent],
  template: `
    @if (store.liveCards().length) {
      <section
        class="live-stack pointer-events-none fixed right-5 top-22 z-75 flex max-h-[calc(100vh-7rem)] w-[min(92vw,28rem)] flex-col gap-3 overflow-y-auto pr-2"
      >
        @if (store.liveOverflowCount() > 0) {
          <article
            class="pointer-events-auto rounded-[1.6rem] border border-border/60 bg-black/80 px-4 py-3 text-white shadow-[0_14px_32px_rgba(15,23,42,0.22)] backdrop-blur-xl"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                  <z-icon zType="bell" class="size-4" />
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                    Más actividad
                  </p>
                  <p class="mt-1 text-sm font-semibold">
                    {{ store.liveOverflowCount() }} notificación{{
                      store.liveOverflowCount() === 1 ? '' : 'es'
                    }}
                    más en cola
                  </p>
                </div>
              </div>

              <button
                z-button
                zType="ghost"
                zSize="sm"
                class="border border-white/15 bg-white/5 text-white hover:bg-white/10"
                (click)="store.clearLiveOverflow()"
              >
                Entendido
              </button>
            </div>
          </article>
        }

        @for (notification of store.liveCards(); track notification.id; let index = $index) {
          <article
            class="notification-card pointer-events-auto relative overflow-hidden rounded-4xl border bg-white/94 backdrop-blur-xl transition-all duration-300 dark:bg-neutral-950/94"
            [class.ring-1]="index === 0"
            [class.scale-[0.985]]="index === 1"
            [class.scale-[0.97]]="index >= 2"
            [style.marginTop.px]="index === 0 ? 0 : -18"
            [style.marginLeft.px]="index * 10"
            [style.zIndex]="30 - index"
            [ngClass]="cardShellClass()"
            (mouseenter)="store.pauseLiveCard(notification.id)"
            (mouseleave)="store.resumeLiveCard(notification.id)"
          >
            <div class="absolute inset-0 opacity-90" [ngClass]="cardAuraClass()"></div>

            <div class="absolute inset-x-0 top-0 h-1.5" [ngClass]="accentBarClass()"></div>

            <div
              class="absolute inset-x-5 bottom-0 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/8"
            >
              <div
                class="notification-progress h-full rounded-full"
                [ngClass]="accentBarClass()"
              ></div>
            </div>

            <div class="relative p-5 pb-6">
              <div class="flex items-start gap-4">
                <div class="relative shrink-0">
                  @if (notification.metadata?.sender?.avatarUrl) {
                    <img
                      [src]="notification.metadata?.sender?.avatarUrl!"
                      [alt]="notification.metadata?.sender?.name || 'Remitente'"
                      class="size-12 rounded-2xl object-cover shadow-inner"
                    />
                  } @else {
                    <div
                      class="flex size-12 items-center justify-center rounded-2xl shadow-inner"
                      [ngClass]="iconShellClass()"
                    >
                      <span class="text-sm font-black">
                        {{ senderInitials(notification) }}
                      </span>
                    </div>
                  }

                  <div
                    class="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-neutral-950"
                    [ngClass]="iconShellClass()"
                  >
                    <z-icon [zType]="iconFor(notification.type)" class="size-3.5" />
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <p
                      class="truncate text-[10px] font-black uppercase tracking-[0.24em]"
                      [ngClass]="kickerClass(notification)"
                    >
                      {{ kickerLabel(notification) }}
                    </p>
                    <span class="shrink-0 text-[10px] font-semibold text-muted-foreground/80">
                      {{ notification.createdAt | date: 'HH:mm' }}
                    </span>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span class="font-bold text-foreground/85">
                      {{ senderName(notification) }}
                    </span>
                    <span class="text-muted-foreground/45">•</span>
                    <span
                      class="rounded-full bg-base-100/80 px-2 py-0.5 font-semibold text-muted-foreground"
                    >
                      {{ senderRole(notification) }}
                    </span>
                  </div>
                  <h3
                    class="mt-2 line-clamp-2 text-[1.02rem] font-black leading-6 tracking-tight text-foreground"
                  >
                    {{ notification.title }}
                  </h3>
                  <p class="mt-2 line-clamp-4 text-[0.93rem] leading-6 text-muted-foreground">
                    {{ notification.content }}
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-full border border-border/60 bg-white/70 p-2 text-muted-foreground transition hover:border-border hover:text-foreground dark:bg-neutral-900/70"
                  (click)="store.dismissLiveCard(notification.id)"
                  aria-label="Cerrar notificación"
                >
                  <z-icon zType="x" class="size-4" />
                </button>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span
                    class="rounded-full border border-primary/15 bg-primary/6 px-2.5 py-1 font-semibold text-primary/80"
                  >
                    {{ priorityLabel(notification.priority) }}
                  </span>
                  <span
                    class="rounded-full border border-primary/15 bg-primary/6 px-2.5 py-1 font-semibold text-primary/80"
                  >
                    {{ typeLabel(notification.type) }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    z-button
                    zType="ghost"
                    zSize="sm"
                    (click)="store.dismissLiveCard(notification.id)"
                  >
                    Omitir
                  </button>

                  <button z-button zType="default" zSize="sm" (click)="open(notification)">
                    <z-icon zType="arrow-right" class="mr-2 size-4" />
                    Ver
                  </button>
                </div>
              </div>
            </div>
          </article>
        }
      </section>
    }
  `,
  styles: [
    `
      .notification-card {
        animation: notification-in 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .live-stack {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
      }

      .live-stack::-webkit-scrollbar {
        width: 8px;
      }

      .live-stack::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.45);
        border-radius: 999px;
      }

      .notification-progress {
        animation: notification-life 7s linear forwards;
        transform-origin: left center;
      }

      @keyframes notification-in {
        from {
          opacity: 0;
          transform: translate3d(22px, -10px, 0) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @keyframes notification-life {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeNotificationStackComponent {
  protected readonly store = inject(NotificationStore);
  private readonly router = inject(Router);

  cardShellClass() {
    return 'border-primary/18 ring-primary/18 shadow-[0_24px_55px_rgba(79,70,229,0.14)] dark:border-primary/20';
  }

  cardAuraClass() {
    return 'bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.08),transparent_38%)]';
  }

  accentBarClass() {
    return 'bg-primary';
  }

  iconShellClass() {
    return 'bg-primary/12 text-primary dark:text-primary';
  }

  senderName(notification: Notification) {
    return notification.metadata?.sender?.name || 'Sistema SISAE';
  }

  senderRole(notification: Notification) {
    return notification.metadata?.sender?.role || 'Sistema';
  }

  senderInitials(notification: Notification) {
    const base = this.senderName(notification);
    return base
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  kickerClass(notification: Notification) {
    switch ((notification.priority || '').toLowerCase()) {
      case 'urgent':
        return 'text-rose-600 dark:text-rose-300';
      case 'high':
        return 'text-amber-600 dark:text-amber-300';
      default:
        return 'text-primary/80';
    }
  }

  kickerLabel(notification: Notification) {
    const priority = (notification.priority || '').toLowerCase();
    if (priority === 'urgent') return 'Atención inmediata';
    if (priority === 'high') return 'Alta prioridad';
    return 'Nueva notificación';
  }

  iconFor(type: string): ZardIcon {
    switch ((type || '').toLowerCase()) {
      case 'success':
        return 'circle-check';
      case 'warning':
        return 'triangle-alert';
      case 'alert':
      case 'error':
        return 'shield';
      default:
        return 'bell';
    }
  }

  open(notification: Notification) {
    this.store.openLiveCard(notification);
    if (notification.linkUrl) {
      this.router.navigateByUrl(notification.linkUrl);
    }
  }

  priorityLabel(priority?: string) {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  }

  typeLabel(type?: string) {
    switch ((type || '').toLowerCase()) {
      case 'success':
        return 'Éxito';
      case 'warning':
        return 'Aviso';
      case 'alert':
      case 'error':
        return 'Alerta';
      default:
        return 'Info';
    }
  }
}
