import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { PushNotificationsService } from '@core/services/push-notifications.service';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';

@Component({
  selector: 'sga-notification-permission-card',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent],
  template: `
    @if (push.shouldShowCard()) {
      <section
        class="fixed bottom-5 right-5 z-[80] w-[min(92vw,24rem)] overflow-hidden rounded-[2rem] border border-border/40 bg-white/95 shadow-[0_22px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:bg-neutral-950/95"
      >
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_40%)]"></div>
        <div class="relative p-5">
          <div class="flex items-start gap-4">
            <div
              class="relative mt-1 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <div class="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-40"></div>
              <z-icon zType="bell" class="relative size-6" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-primary/80">
                Notificaciones push
              </p>
              <h3 class="mt-1 text-lg font-black tracking-tight text-foreground">
                {{ headline() }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ description() }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:border-border hover:text-foreground"
              (click)="push.dismissCard()"
              aria-label="Cerrar tarjeta"
            >
              <z-icon zType="x" class="size-4" />
            </button>
          </div>

          <div class="mt-4 flex items-center gap-2 rounded-2xl bg-base-100/80 px-4 py-3 text-xs text-muted-foreground">
            <z-icon [zType]="helperIcon()" class="size-4 shrink-0 text-primary" />
            <span>{{ helperText() }}</span>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            @if (push.state() === 'default' || (push.state() === 'granted' && !push.isSubscribed())) {
              <button
                z-button
                zType="default"
                class="min-w-36 font-bold"
                [disabled]="push.isBusy()"
                (click)="push.enablePush()"
              >
                @if (push.isBusy()) {
                  <z-icon zType="loader-circle" class="mr-2 size-4 animate-spin" />
                } @else {
                  <z-icon zType="badge-check" class="mr-2 size-4" />
                }
                Activar ahora
              </button>
            }

            <button z-button zType="ghost" class="font-bold" (click)="push.dismissCard()">
              Más tarde
            </button>
          </div>
        </div>
      </section>
    }
  `,
})
export class NotificationPermissionCardComponent {
  protected readonly push = inject(PushNotificationsService);

  protected readonly headline = computed(() => {
    switch (this.push.state()) {
      case 'granted':
        return 'Terminemos de enlazar este navegador';
      case 'denied':
        return 'El navegador bloqueó los avisos';
      default:
        return 'Activa alertas en tiempo real';
    }
  });

  protected readonly description = computed(() => {
    switch (this.push.state()) {
      case 'granted':
        return 'Ya diste permiso. Solo falta registrar este navegador para recibir recordatorios y avisos aunque la app no esté abierta.';
      case 'denied':
        return 'Necesitas volver a habilitar las notificaciones del sitio desde el navegador para recibir avisos de clases, pagos y novedades.';
      default:
        return 'Recibe recordatorios de clases, mensajes importantes y notificaciones institucionales incluso si tienes la pestaña minimizada.';
    }
  });

  protected readonly helperText = computed(() => {
    switch (this.push.state()) {
      case 'granted':
        return 'Registro pendiente en este equipo.';
      case 'denied':
        return 'Revisa el candado o ajustes del sitio y vuelve a permitir notificaciones.';
      default:
        return 'Solo te pediremos permiso una vez por navegador.';
    }
  });

  protected readonly helperIcon = computed(() => {
    switch (this.push.state()) {
      case 'granted':
        return 'badge-check';
      case 'denied':
        return 'triangle-alert';
      default:
        return 'sparkles';
    }
  });
}
