import { inject, Injectable, OnDestroy } from '@angular/core';
import { AuthStore } from '@auth/services/store/auth.store';
import { TokenManager } from '@auth/services/api/token-manager';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import type { Notification } from './api/notification-api';

@Injectable({ providedIn: 'root' })
export class NotificationSocketService implements OnDestroy {
  private readonly tokenManager = inject(TokenManager);
  private readonly authStore = inject(AuthStore);
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;

  readonly notification$ = new Subject<Notification>();

  connect(): void {
    const userId = this.authStore.currentUser()?.id ?? null;
    if (!userId) return;
    if (this.socket && this.connectedUserId === userId) return;

    this.disconnect();

    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(wsBase, {
      transports: ['websocket'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
    });
    this.connectedUserId = userId;

    this.socket.on('notification:new', (notification: Notification) => {
      this.notification$.next(notification);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
