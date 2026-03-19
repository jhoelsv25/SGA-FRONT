import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: string;
  user: {
    id: string | null;
    name: string | null;
    avatar: string | null;
  } | null;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  description: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private http = inject(HttpClient);
  private baseUrl = `audit`;

  getAll(params: Record<string, string | number | boolean> = {}): Observable<{ data: AuditLog[]; nextCursor: string | null }> {
    return this.http.get<{ data: AuditLog[]; nextCursor: string | null }>(this.baseUrl, { params });
  }

  getById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.baseUrl}/${id}`);
  }
}
