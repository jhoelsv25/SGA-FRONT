import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GlobalSearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  route: string;
}

export interface GlobalSearchResponse {
  data: GlobalSearchItem[];
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'search';

  search(params: { search?: string; limit?: number }): Observable<GlobalSearchResponse> {
    let httpParams = new HttpParams();
    if (params.search !== undefined) httpParams = httpParams.set('search', params.search);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<GlobalSearchResponse>(`${this.baseUrl}/global`, { params: httpParams });
  }
}
