import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions?: { id: string; slug: string; name: string; module: string; scope: string }[];
  permissionIds?: string[];
  userCount?: number;
  permissionsCount?: number;
}

@Injectable({ providedIn: 'root' })
export class RoleApi {
  private http = inject(HttpClient);
  private baseUrl = `roles`;

  getAll(params: Record<string, string | number | boolean> = {}): Observable<{ data: Role[]; total: number }> {
    return this.http.get<{ data: Role[]; total: number }>(this.baseUrl, { params });
  }

  getModules(id: string): Observable<{ modules: unknown[] }> {
    return this.http.get<{ modules: unknown[] }>(`${this.baseUrl}/${id}/modules`);
  }

  getById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  create(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, role);
  }

  update(id: string, role: Partial<Role>): Observable<Role> {
    return this.http.patch<Role>(`${this.baseUrl}/${id}`, role);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
