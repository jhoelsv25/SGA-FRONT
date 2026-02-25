import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  CommunicationCreate,
  CommunicationResponse,
  CommunicationsListResponse,
  CommunicationUpdate,
} from '../types/communication-types';

@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'communications';

  getAll(params?: Params): Observable<CommunicationsListResponse> {
    return this.http.get<CommunicationsListResponse>(this.baseUrl, { params: params ?? {} });
  }

  getById(id: string): Observable<CommunicationResponse> {
    return this.http.get<CommunicationResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: CommunicationCreate): Observable<CommunicationResponse> {
    return this.http.post<CommunicationResponse>(this.baseUrl, data);
  }

  update(id: string, data: CommunicationUpdate): Observable<CommunicationResponse> {
    return this.http.patch<CommunicationResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
