import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@auth/services/store/auth.store';
import { NotificationApi } from './api/notification-api';
import { Toast } from './toast';

type PushCardState = 'unsupported' | 'default' | 'granted' | 'denied';
const PUSH_CARD_BOOT_DELAY_MS = 1800;

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authStore = inject(AuthStore);
  private readonly notificationApi = inject(NotificationApi);
  private readonly toast = inject(Toast);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly dismissed = signal(false);
  private readonly syncing = signal(false);
  private readonly subscribed = signal(false);
  private readonly hydrated = signal(false);
  private readonly permission = signal<NotificationPermission | 'unsupported'>(
    this.browser && 'Notification' in window ? Notification.permission : 'unsupported',
  );

  readonly supported = computed(
    () =>
      this.browser &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window,
  );

  readonly currentUser = computed(() => this.authStore.currentUser());
  readonly state = computed<PushCardState>(() => {
    if (!this.supported()) return 'unsupported';
    return this.permission();
  });
  readonly isBusy = this.syncing.asReadonly();
  readonly isSubscribed = this.subscribed.asReadonly();
  readonly shouldShowCard = computed(() => {
    if (!this.currentUser()) return false;
    if (!this.supported()) return false;
    if (!this.hydrated()) return false;
    if (this.dismissed()) return false;
    const state = this.state();
    return (
      state === 'default' || state === 'denied' || (state === 'granted' && !this.isSubscribed())
    );
  });

  constructor() {
    if (this.browser) {
      effect(() => {
        const user = this.authStore.currentUser();
        if (!user || !this.supported()) {
          this.subscribed.set(false);
          this.hydrated.set(false);
          return;
        }

        this.dismissed.set(false);
        this.hydrated.set(false);
        this.refreshPermissionState();
        if (this.permission() === 'granted') {
          void this.ensureSubscribed(true);
        }

        window.setTimeout(() => {
          if (this.authStore.currentUser()?.id === user.id) {
            this.hydrated.set(true);
          }
        }, PUSH_CARD_BOOT_DELAY_MS);
      });
    }
  }

  async enablePush() {
    if (!this.supported() || this.syncing()) return;

    this.syncing.set(true);
    try {
      const permission = await Notification.requestPermission();
      this.permission.set(permission);

      if (permission !== 'granted') {
        if (permission === 'denied') {
          this.toast.warning('Las notificaciones quedaron bloqueadas en el navegador.');
        }
        return;
      }

      await this.ensureSubscribed(false);
      this.dismissed.set(true);
      this.toast.success('Notificaciones push activadas correctamente.');
    } catch (error) {
      console.error('[PushNotificationsService] Error enabling push', error);
      this.toast.error(this.resolveErrorMessage(error));
    } finally {
      this.syncing.set(false);
    }
  }

  dismissCard() {
    this.dismissed.set(true);
  }

  refreshPermissionState() {
    if (!this.supported()) {
      this.permission.set('unsupported');
      return;
    }
    this.permission.set(Notification.permission);
  }

  private async ensureSubscribed(silent: boolean) {
    if (!this.supported()) return;

    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    const browserSubscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(await this.fetchPublicKey()),
      }));

    const payload = browserSubscription.toJSON();
    if (!payload.endpoint || !payload.keys?.['p256dh'] || !payload.keys?.['auth']) {
      throw new Error('Suscripción push inválida');
    }

    await firstValueFrom(
      this.notificationApi.registerPushSubscription({
        endpoint: payload.endpoint,
        expirationTime: payload.expirationTime ?? null,
        keys: {
          p256dh: payload.keys['p256dh'],
          auth: payload.keys['auth'],
        },
        userAgent: navigator.userAgent,
      }),
    );

    this.subscribed.set(true);
    if (!silent) {
      this.dismissed.set(true);
    }
  }

  private resolveErrorMessage(error: unknown) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'El navegador bloqueó el permiso de notificaciones.';
      }
      if (error.name === 'AbortError') {
        return 'El navegador canceló la suscripción push. Intenta otra vez.';
      }
      if (error.name === 'InvalidStateError') {
        return 'El service worker aún no está listo para registrar notificaciones.';
      }
      if (error.name === 'InvalidAccessError') {
        return 'La clave pública push no fue aceptada por el navegador.';
      }
      return error.message || 'No se pudo activar las notificaciones push.';
    }

    if (typeof error === 'object' && error !== null) {
      const maybeHttp = error as {
        error?: { message?: string };
        message?: string;
      };

      if (maybeHttp.error?.message) {
        return maybeHttp.error.message;
      }

      if (maybeHttp.message) {
        return maybeHttp.message;
      }
    }

    return 'No se pudo activar las notificaciones push.';
  }

  private async fetchPublicKey() {
    const response = await firstValueFrom(this.notificationApi.getPushPublicKey());
    return response.data.publicKey;
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }
}
