import { inject, Injectable, OnDestroy } from '@angular/core';
import { AuthStore } from '@auth/services/store/auth.store';
import { TokenManager } from '@auth/services/api/token-manager';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import type { Report } from '../types/report-types';

@Injectable({ providedIn: 'root' })
export class ReportSocketService implements OnDestroy {
  private readonly tokenManager = inject(TokenManager);
  private readonly authStore = inject(AuthStore);
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;

  readonly report$ = new Subject<Report>();

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

    this.socket.on('report:status', (report: Report) => {
      this.report$.next(report);
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
