import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

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

  connect(room: string): void {
    if (this.socket) this.socket.disconnect();

    this.socket = io(`http://localhost:3000/classroom`, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', room);
    });

    this.socket.on('newMessage', (msg: SocketMessage) => {
      this.message$.next(msg);
    });

    this.socket.on('feedUpdate', (post: FeedPost) => {
      this.feedUpdate$.next(post);
    });
  }

  sendMessage(room: string, message: Record<string, unknown>): void {
    this.socket?.emit('sendMessage', { room, message });
  }

  notifyNewPost(room: string, post: Record<string, unknown>): void {
    this.socket?.emit('newPost', { room, post });
  }

  ngOnDestroy() {
    this.socket?.disconnect();
  }
}
