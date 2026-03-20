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
}

export interface NotificationCursorResponse {
  data: Notification[];
  nextCursor: { date: string; id: string } | null;
  unreadCount: number;
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
}
