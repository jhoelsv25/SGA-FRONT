import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  PaymentCreate,
  PaymentGroupCreate,
  PaymentGroupResponse,
  PaymentGroupsListResponse,
  PaymentResponse,
  PaymentsListResponse,
  PaymentUpdate,
} from '../types/payment-types';

@Injectable({ providedIn: 'root' })
export class PaymentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'payments';

  getAll(params?: Params): Observable<PaymentsListResponse> {
    return this.http.get<PaymentsListResponse>(this.baseUrl, { params: params ?? {} });
  }

  getPending(params?: Params): Observable<PaymentsListResponse> {
    return this.http.get<PaymentsListResponse>(`${this.baseUrl}/pending`, { params: params ?? {} });
  }

  getHistory(params?: Params): Observable<PaymentsListResponse> {
    return this.http.get<PaymentsListResponse>(`${this.baseUrl}/history`, { params: params ?? {} });
  }

  getGroups(params?: Params): Observable<PaymentGroupsListResponse> {
    return this.http.get<PaymentGroupsListResponse>(`${this.baseUrl}/groups`, {
      params: params ?? {},
    });
  }

  getGroupById(id: string): Observable<PaymentGroupResponse> {
    return this.http.get<PaymentGroupResponse>(`${this.baseUrl}/groups/${id}`);
  }

  createGroup(data: PaymentGroupCreate): Observable<PaymentGroupResponse> {
    return this.http.post<PaymentGroupResponse>(`${this.baseUrl}/groups`, data);
  }

  updateGroup(id: string, data: Partial<PaymentGroupCreate>): Observable<PaymentGroupResponse> {
    return this.http.patch<PaymentGroupResponse>(`${this.baseUrl}/groups/${id}`, data);
  }

  getById(id: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: PaymentCreate): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, data);
  }

  update(id: string, data: PaymentUpdate): Observable<PaymentResponse> {
    return this.http.patch<PaymentResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
