import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VirtualClassroomsResponse } from '../types/virtual-classroom-types';

@Injectable({ providedIn: 'root' })
export class VirtualClassroomApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'virtual-classrooms';

  getAll(params?: Record<string, string | number>): Observable<VirtualClassroomsResponse> {
    return this.http.get<VirtualClassroomsResponse>(this.baseUrl, { params: params ?? {} });
  }

  getById(id: string): Observable<{ data: any; message?: string }> {
    return this.http.get<{ data: any; message?: string }>(`${this.baseUrl}/${id}`);
  }
}
