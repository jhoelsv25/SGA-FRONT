import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ModulesListCursorResponse,
  ModulesListOffsetResponse,
  ModulesListParams,
} from '../../types/modules-list-types';

@Injectable({ providedIn: 'root' })
export class ModulesListApi {
  private readonly http = inject(HttpClient);
  private readonly basePath = 'modules';

  getAll(params: ModulesListParams): Observable<ModulesListOffsetResponse | ModulesListCursorResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<ModulesListOffsetResponse | ModulesListCursorResponse>(this.basePath, {
      params: httpParams,
    });
  }
}
