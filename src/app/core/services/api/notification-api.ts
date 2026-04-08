import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  linkUrl: string | null;
  sendAt: string;
  readAt: string | null;
  type: string;
  priority: string;
  recipientId: string;
  createdAt: string;
  metadata?: {
    sender?: {
      id?: string;
      name?: string;
      role?: string;
      avatarUrl?: string | null;
    };
    [key: string]: unknown;
  };
}

export interface NotificationCursorResponse {
  data: Notification[];
  nextCursor: { date: string; id: string } | null;
  unreadCount: number;
}

export interface PushPublicKeyResponse {
  message: string;
  data: {
    publicKey: string;
  };
}

export interface BrowserPushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'notifications';

  findAllCursor(params: Record<string, any> = {}): Observable<NotificationCursorResponse> {
    return this.http.get<NotificationCursorResponse>(`${this.baseUrl}/cursor`, { params });
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, { isRead: true });
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.baseUrl}/mark-all-read`, {});
  }

  getPushPublicKey(): Observable<PushPublicKeyResponse> {
    return this.http.get<PushPublicKeyResponse>(`${this.baseUrl}/push/public-key`);
  }

  registerPushSubscription(payload: BrowserPushSubscriptionPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/push/subscriptions`, payload);
  }

  unregisterPushSubscription(endpoint?: string): Observable<any> {
    const params: Record<string, string> = endpoint ? { endpoint } : {};
    return this.http.delete(`${this.baseUrl}/push/subscriptions`, { params });
  }
}
