import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { User, UserResponse } from '@features/users/types/user-types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'users';

  getAll(params: Params = {}): Observable<{ data: User[]; nextCursor: string | null }> {
    return this.http.get<{ data: User[]; nextCursor: string | null }>(this.baseUrl, { params });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(user: Partial<User>): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, user);
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/import/template`, {
      responseType: 'blob',
    });
  }

  getImportHistory(): Observable<
    {
      id: string;
      jobId: string;
      fileName: string;
      totalRows: number;
      processedRows: number;
      createdRows: number;
      failedRows: number;
      status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
      startedAt?: string | null;
      finishedAt?: string | null;
      createdAt: string;
      errorDetails?: { row: number; message: string; rowData?: Record<string, unknown> }[] | null;
    }[]
  > {
    return this.http.get<
      {
        id: string;
        jobId: string;
        fileName: string;
        totalRows: number;
        processedRows: number;
        createdRows: number;
        failedRows: number;
        status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
        startedAt?: string | null;
        finishedAt?: string | null;
        createdAt: string;
        errorDetails?: { row: number; message: string; rowData?: Record<string, unknown> }[] | null;
      }[]
    >(`${this.baseUrl}/import/history`);
  }

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

  startImport(
    uploadId: string,
    columnMapping: Record<string, string>,
  ): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(`${this.baseUrl}/import/start`, {
      uploadId,
      columnMapping,
    });
  }

  update(id: string, user: Partial<User>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, user);
  }

  delete(id: string): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.baseUrl}/${id}`);
  }
}
