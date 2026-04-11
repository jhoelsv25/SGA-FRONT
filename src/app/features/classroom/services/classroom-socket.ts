import { inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { TokenManager } from '@auth/services/api/token-manager';
import { environment } from '../../../../environments/environment.development';
import type { ClassroomTask } from './classroom-api';

export interface SocketMessage {
  id: string;
  senderId: string;
  content: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  timestamp: string;
}

export interface FeedPost {
  id: string;
  type: string;
  title?: string;
  content: string;
  date: string;
  author: { name: string; role?: string };
  metadata?: { attachments?: { url: string; name: string }[]; [key: string]: unknown };
  commentsCount?: number;
  [key: string]: unknown;
}

export interface ClassroomFeedSocketEvent {
  action: 'created' | 'updated' | 'deleted';
  item?: FeedPost;
  id?: string;
}

export interface ClassroomTaskSocketEvent {
  action: 'updated' | 'deleted';
  task?: ClassroomTask;
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class ClassroomSocketService implements OnDestroy {
  private readonly tokenManager = inject(TokenManager);
  private socket: Socket | null = null;

  public readonly message$ = new Subject<SocketMessage>();
  public readonly feedEvent$ = new Subject<ClassroomFeedSocketEvent>();
  public readonly taskEvent$ = new Subject<ClassroomTaskSocketEvent>();
  public readonly notification$ = new Subject<{ type: string; title: string; body?: string }>();

  connect(room: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(`${wsBase}/classroom`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: this.tokenManager.getToken() ? { token: this.tokenManager.getToken() } : undefined,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', room);
    });

    this.socket.on('newMessage', (msg: SocketMessage) => {
      this.message$.next(msg);
      this.notification$.next({ type: 'message', title: msg.senderName, body: msg.content });
    });

    this.socket.on('feedCreated', (post: FeedPost) => {
      this.feedEvent$.next({ action: 'created', item: post });
      this.notification$.next({
        type: 'feed',
        title: 'Nueva publicacion',
        body: post.author?.name ? `${post.author.name} publico en el muro` : undefined,
      });
    });

    this.socket.on('feedUpdated', (post: FeedPost) => {
      this.feedEvent$.next({ action: 'updated', item: post });
    });

    this.socket.on('feedDeleted', (payload: { id: string }) => {
      this.feedEvent$.next({ action: 'deleted', id: payload.id });
    });

    this.socket.on('taskUpdated', (task: ClassroomTask) => {
      this.taskEvent$.next({ action: 'updated', task });
    });

    this.socket.on('taskDeleted', (payload: { id: string }) => {
      this.taskEvent$.next({ action: 'deleted', id: payload.id });
    });

    this.socket.on('connect_error', () => {
      this.notification$.next({
        type: 'error',
        title: 'Conexion perdida',
        body: 'No se pudo conectar al canal realtime.',
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(room: string, content: string): Observable<SocketMessage> {
    return new Observable<SocketMessage>((subscriber) => {
      if (!this.socket) {
        subscriber.error(new Error('Socket no conectado'));
        return;
      }

      this.socket.emit('sendMessage', { room, message: { content } }, (response: SocketMessage) => {
        subscriber.next(response);
        subscriber.complete();
      });
    });
  }

  publishPost(
    room: string,
    post: { content: string; attachments?: { url: string; name: string }[] },
  ): Observable<FeedPost> {
    return new Observable<FeedPost>((subscriber) => {
      if (!this.socket) {
        subscriber.error(new Error('Socket no conectado'));
        return;
      }

      this.socket.emit(
        'newPost',
        {
          room,
          post: {
            content: post.content,
            attachmentUrl: post.attachments?.[0]?.url,
          },
        },
        (response: FeedPost) => {
          subscriber.next(response);
          subscriber.complete();
        },
      );
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
