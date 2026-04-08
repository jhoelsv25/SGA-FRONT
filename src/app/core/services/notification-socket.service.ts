import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AuthStore } from '@auth/services/store/auth.store';
import { TokenManager } from '@auth/services/api/token-manager';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import type { Notification } from './api/notification-api';
import type {
  TeacherLiveSessionResponse,
  TeacherRealtimeOverviewResponse,
} from '@features/teachers/types/teacher-attendance-types';

@Injectable({ providedIn: 'root' })
export class NotificationSocketService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly tokenManager = inject(TokenManager);
  private readonly authStore = inject(AuthStore);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private boundReconnectHandler = this.handleReconnectTrigger.bind(this);

  readonly notification$ = new Subject<Notification>();
  readonly teacherLiveSession$ = new Subject<TeacherLiveSessionResponse['data']>();
  readonly teacherRealtimeOverview$ = new Subject<TeacherRealtimeOverviewResponse['data']>();

  connect(): void {
    if (!this.isBrowser) return;

    const userId = this.authStore.currentUser()?.id ?? null;
    if (!userId) return;
    if (this.socket && this.connectedUserId === userId) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.disconnect();

    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(wsBase, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    this.connectedUserId = userId;

    this.socket.on('notification:new', (notification: Notification) => {
      console.info('[NotificationSocketService] notification:new', notification.id);
      this.notification$.next(notification);
    });

    this.socket.on(
      'teacher-live-session:update',
      (payload: TeacherLiveSessionResponse['data']) => {
        console.info('[NotificationSocketService] teacher-live-session:update');
        this.teacherLiveSession$.next(payload);
      },
    );

    this.socket.on(
      'teacher-live-overview:update',
      (payload: TeacherRealtimeOverviewResponse['data']) => {
        console.info('[NotificationSocketService] teacher-live-overview:update');
        this.teacherRealtimeOverview$.next(payload);
      },
    );

    this.socket.on('connect', () => {
      console.info('[NotificationSocketService] Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[NotificationSocketService] Socket disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[NotificationSocketService] connect_error', error?.message ?? error);
    });

    this.socket.io.on('reconnect', () => {
      console.info('[NotificationSocketService] Socket reconnected');
    });

    window.addEventListener('focus', this.boundReconnectHandler);
    window.addEventListener('online', this.boundReconnectHandler);
    this.document.addEventListener('visibilitychange', this.boundReconnectHandler);
  }

  disconnect(): void {
    if (this.isBrowser) {
      window.removeEventListener('focus', this.boundReconnectHandler);
      window.removeEventListener('online', this.boundReconnectHandler);
      this.document.removeEventListener('visibilitychange', this.boundReconnectHandler);
    }
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
  }

  private handleReconnectTrigger(): void {
    if (!this.isBrowser || !this.socket) return;

    if (this.document.visibilityState === 'hidden') return;
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
