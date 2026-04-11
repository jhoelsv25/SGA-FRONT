import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import {
  Student,
  StudentCreate,
  StudentCredentialResponse,
  StudentResponse,
  StudentUpdate,
} from '@features/students/types/student-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'students';

  getAll(params: Params = {}): Observable<DataResponse<Student>> {
    return this.http.get<DataResponse<Student>>(`${this.baseUrl}`, {
      params: this.cleanParams(params),
    });
  }

  getById(id: string): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/${id}`);
  }

  getCredential(id: string): Observable<StudentCredentialResponse> {
    return this.http.get<StudentCredentialResponse>(`${this.baseUrl}/${id}/credential`);
  }

  create(student: StudentCreate): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.baseUrl}`, student);
  }

  update(id: string, student: StudentUpdate): Observable<StudentResponse> {
    return this.http.patch<StudentResponse>(`${this.baseUrl}/${id}`, student);
  }

  regenerateCredential(id: string): Observable<StudentCredentialResponse> {
    return this.http.post<StudentCredentialResponse>(
      `${this.baseUrl}/${id}/credential/regenerate`,
      {},
    );
  }

  delete(id: string): Observable<DataResponse<StudentResponse>> {
    return this.http.delete<DataResponse<StudentResponse>>(`${this.baseUrl}/${id}`);
  }

  /** Importación masiva (síncrona). Backend recibe JSON array. */
  import(
    rows: StudentCreate[],
  ): Observable<{ created: number; errors?: { row: number; message: string }[] }> {
    return this.http.post<{ created: number; errors?: { row: number; message: string }[] }>(
      `${this.baseUrl}/import`,
      { rows },
    );
  }

  /** Sube archivo Excel y obtiene encabezados para mapeo. */
  uploadImportFile(
    file: File,
  ): Observable<{ uploadId: string; headers: string[]; rowCount: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ uploadId: string; headers: string[]; rowCount: number }>(
      `${this.baseUrl}/import/upload`,
      form,
    );
  }

  /** Inicia importación asíncrona por colas. Progreso vía WebSocket. */
  startImport(
    uploadId: string,
    columnMapping: Record<string, string>,
  ): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(`${this.baseUrl}/import/start`, {
      uploadId,
      columnMapping,
    });
  }

  private cleanParams(params: Params): Params {
    return Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== '' &&
          value !== 'undefined' &&
          value !== 'null',
      ),
    );
  }
}
