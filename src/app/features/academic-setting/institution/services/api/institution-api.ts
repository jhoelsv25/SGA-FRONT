import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { Institution, InstitutionResponse } from '../../types/institution-types';

@Injectable({ providedIn: 'root' })
export class InstitutionApi {
  private readonly http = inject(HttpClient);
  static readonly basePath = 'institution';

  public getAll(params: Params): Observable<Institution[]> {
    return this.http.get<Institution[]>(`${InstitutionApi.basePath}`, { params });
  }

  public getById(id: string): Observable<Institution> {
    return this.http.get<Institution>(`${InstitutionApi.basePath}/${id}`);
  }

  public create(data: Partial<Institution>): Observable<InstitutionResponse> {
    return this.http.post<InstitutionResponse>(`${InstitutionApi.basePath}`, data);
  }

  public update(id: string, data: Partial<Institution>): Observable<InstitutionResponse> {
    return this.http.put<InstitutionResponse>(`${InstitutionApi.basePath}/${id}`, data);
  }

  public delete(id: string): Observable<InstitutionResponse> {
    return this.http.delete<InstitutionResponse>(`${InstitutionApi.basePath}/${id}`);
  }
}
