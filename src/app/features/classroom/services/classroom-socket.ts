import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface SocketMessage {
  id: string;
  senderId: string;
  content: string;
  senderName: string;
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

@Injectable({ providedIn: 'root' })
export class ClassroomSocketService implements OnDestroy {
  private socket: Socket | null = null;
  public message$ = new Subject<SocketMessage>();
  public feedUpdate$ = new Subject<FeedPost>();
  /** Notificaciones en tiempo real (nuevo mensaje, nuevo post, etc.) */
  public notification$ = new Subject<{ type: string; title: string; body?: string }>();

  connect(room: string): void {
    if (this.socket) this.socket.disconnect();
    const wsBase = (environment as { wsUrl?: string }).wsUrl ?? 'http://localhost:3000';
    this.socket = io(`${wsBase}/classroom`, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', room);
    });

    this.socket.on('newMessage', (msg: SocketMessage) => {
      this.message$.next(msg);
      this.notification$.next({ type: 'message', title: msg.senderName, body: msg.content });
    });

    this.socket.on('feedUpdate', (post: FeedPost) => {
      this.feedUpdate$.next(post);
      this.notification$.next({
        type: 'feed',
        title: 'Nueva publicación',
        body: post.author?.name ? `${post.author.name} publicó en el muro` : undefined,
      });
    });

    this.socket.on('connect_error', () => {
      this.notification$.next({ type: 'error', title: 'Conexión perdida', body: 'Reconectando...' });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(room: string, message: Record<string, unknown>): void {
    this.socket?.emit('sendMessage', { room, message });
  }

  notifyNewPost(room: string, post: Record<string, unknown>): void {
    this.socket?.emit('newPost', { room, post });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
