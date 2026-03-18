import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { TokenManager } from '@auth/services/api/token-manager';
import { environment } from '../../../../environments/environment';

export interface UserImportProgressPayload {
  jobId: string;
  processed: number;
  total: number;
  percentage: number;
  created: number;
  errors: { row: number; message: string; rowData?: Record<string, unknown> }[];
}

@Injectable({ providedIn: 'root' })
export class UserImportSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly tokenManager = inject(TokenManager);

  readonly progress$ = new Subject<UserImportProgressPayload>();
  readonly complete$ = new Subject<UserImportProgressPayload>();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.wsUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
    });

    this.socket.on('import:progress', (payload: UserImportProgressPayload) => this.progress$.next(payload));
    this.socket.on('import:complete', (payload: UserImportProgressPayload) => this.complete$.next(payload));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
