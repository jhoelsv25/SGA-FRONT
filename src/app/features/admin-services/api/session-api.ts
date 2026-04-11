import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../users/types/user-types';

export interface Session {
  id: string;
  sessionToken: string;
  expiresAt: string;
  lastActive: string;
  userAgent: string;
  ipAddress: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private http = inject(HttpClient);
  private baseUrl = `sessions`;

  getAll(
    params: Record<string, string | number | boolean> = {},
  ): Observable<{ data: Session[]; total: number }> {
    return this.http.get<{ data: Session[]; total: number }>(this.baseUrl, { params });
  }

  getByUser(
    userId: string,
    params: Record<string, string | number | boolean> = {},
  ): Observable<{ data: Session[]; total: number }> {
    return this.http.get<{ data: Session[]; total: number }>(`${this.baseUrl}/user/${userId}`, {
      params,
    });
  }

  getById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
