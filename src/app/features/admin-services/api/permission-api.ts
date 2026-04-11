import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Permission {
  id: string;
  slug: string;
  name: string;
  description?: string;
  module: string;
  scope: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionApi {
  private http = inject(HttpClient);
  private baseUrl = `permissions`;

  getAll(
    params: Record<string, string | number | boolean> = {},
  ): Observable<{ data: Permission[]; total: number }> {
    return this.http.get<{ data: Permission[]; total: number }>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.baseUrl}/${id}`);
  }

  create(permission: Partial<Permission>): Observable<Permission> {
    return this.http.post<Permission>(this.baseUrl, permission);
  }

  update(id: string, permission: Partial<Permission>): Observable<Permission> {
    return this.http.patch<Permission>(`${this.baseUrl}/${id}`, permission);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
