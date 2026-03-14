import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { DashboardResponse } from '@features/dashboard/domain/dashboard-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'dashboard';

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.baseUrl);
  }
}
