import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import {
  Student,
  StudentCreate,
  StudentResponse,
  StudentUpdate,
} from '@features/students/types/student-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'students';

  getAll(params: Params = {}): Observable<DataResponse<Student>> {
    return this.http.get<DataResponse<Student>>(`${this.baseUrl}`, { params });
  }

  getById(id: string): Observable<DataResponse<Student>> {
    return this.http.get<DataResponse<Student>>(`${this.baseUrl}/${id}`);
  }

  create(student: StudentCreate): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.baseUrl}`, student);
  }

  update(id: string, student: StudentUpdate): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.baseUrl}/${id}`, student);
  }

  delete(id: string): Observable<DataResponse<StudentResponse>> {
    return this.http.delete<DataResponse<StudentResponse>>(`${this.baseUrl}/${id}`);
  }
}
