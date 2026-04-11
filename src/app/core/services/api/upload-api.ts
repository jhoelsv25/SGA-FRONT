import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type UploadPayload = {
  category?: string;
  entityCode?: string;
  preserveName?: boolean;
};

export type UploadResponse = {
  url: string;
  name: string;
  storedName?: string;
  category?: string;
};

@Injectable({ providedIn: 'root' })
export class UploadApi {
  private readonly http = inject(HttpClient);

  upload(file: File, payload?: UploadPayload): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (payload?.category) formData.append('category', payload.category);
    if (payload?.entityCode) formData.append('entityCode', payload.entityCode);
    if (payload?.preserveName !== undefined)
      formData.append('preserveName', String(payload.preserveName));
    return this.http.post<UploadResponse>('uploads', formData);
  }
}
