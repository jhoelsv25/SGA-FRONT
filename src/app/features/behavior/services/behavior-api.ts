import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  BehaviorCreate,
  BehaviorResponse,
  BehaviorsListResponse,
  BehaviorUpdate,
} from '../types/behavior-types';

@Injectable({ providedIn: 'root' })
export class BehaviorApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'behaviors';

  getAll(params?: Params): Observable<BehaviorsListResponse> {
    return this.http.get<BehaviorsListResponse>(this.baseUrl, { params: params ?? {} });
  }

  getById(id: string): Observable<BehaviorResponse> {
    return this.http.get<BehaviorResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: BehaviorCreate): Observable<BehaviorResponse> {
    return this.http.post<BehaviorResponse>(this.baseUrl, data);
  }

  update(id: string, data: BehaviorUpdate): Observable<BehaviorResponse> {
    return this.http.patch<BehaviorResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
