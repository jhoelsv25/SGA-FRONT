import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  PaymentCreate,
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
