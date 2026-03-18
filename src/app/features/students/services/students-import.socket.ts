import { inject, Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { TokenManager } from '@auth/services/api/token-manager';

export interface ImportProgressPayload {
  jobId: string;
  processed: number;
  total: number;
  percentage: number;
  created: number;
  errors: { row: number; message: string }[];
}

@Injectable({ providedIn: 'root' })
export class StudentsImportSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly tokenManager = inject(TokenManager);
  public progress$ = new Subject<ImportProgressPayload>();
  public complete$ = new Subject<ImportProgressPayload>();

  connect(): void {
    if (this.socket?.connected) return;
    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(wsBase, {
      transports: ['websocket'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
    });
    this.socket.on('import:progress', (payload: ImportProgressPayload) => this.progress$.next(payload));
    this.socket.on('import:complete', (payload: ImportProgressPayload) => this.complete$.next(payload));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
