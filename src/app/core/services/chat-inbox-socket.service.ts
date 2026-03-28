import { inject, Injectable, OnDestroy } from '@angular/core';
import { TokenManager } from '@auth/services/api/token-manager';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import type { ChatInboxItem } from '@features/classroom/types/classroom-types';

@Injectable({ providedIn: 'root' })
export class ChatInboxSocketService implements OnDestroy {
  private readonly tokenManager = inject(TokenManager);
  private socket: Socket | null = null;

  readonly inboxUpdate$ = new Subject<ChatInboxItem>();

  connect(): void {
    if (this.socket) return;

    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(wsBase, {
      transports: ['websocket'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
    });

    this.socket.on('chat:inbox:update', (payload: ChatInboxItem) => {
      this.inboxUpdate$.next(payload);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
