import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Toast } from '@core/services/toast';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(Toast);

  private readonly API_URL = `${environment.apiUrl}/notifications/push`;

  constructor() {}

  /**
   * Solicita permiso y suscribe al usuario para notificaciones push
   */
  requestPermissionAndSubscribe() {
    if (!this.swPush.isEnabled) {
      console.warn('Service Worker / Push no está habilitado en este navegador.');
      return;
    }

    // Primero obtenemos la llave pública del servidor
    this.http
      .get<{ publicKey: string }>(`${this.API_URL}/public-key`)
      .pipe(
        switchMap(({ publicKey }) => {
          return this.swPush.requestSubscription({
            serverPublicKey: publicKey,
          });
        }),
        switchMap((subscription) => {
          // Enviamos la suscripción al backend
          return this.http.post(`${this.API_URL}/subscriptions`, subscription);
        }),
        tap(() => {
          console.log('Suscripción a notificaciones push exitosa');
        }),
        catchError((error) => {
          console.error('Error suscribiendo a notificaciones push', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Elimina la suscripción del usuario
   */
  unsubscribe() {
    this.swPush.subscription
      .pipe(
        switchMap((sub) => {
          if (!sub) return of(null);
          return this.http
            .delete(`${this.API_URL}/subscriptions`, {
              params: { endpoint: sub.endpoint },
            })
            .pipe(switchMap(() => this.swPush.unsubscribe()));
        }),
      )
      .subscribe();
  }
}
