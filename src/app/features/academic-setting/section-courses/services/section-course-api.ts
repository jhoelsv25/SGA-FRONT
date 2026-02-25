import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SectionCourse {
  id: string;
  section?: { id: string; name: string };
  course?: { id: string; name: string };
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SectionCourseApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'section-course';

  getAll(): Observable<SectionCourse[]> {
    return this.http.get<SectionCourse[]>(this.baseUrl);
  }

  getById(id: string): Observable<SectionCourse> {
    return this.http.get<SectionCourse>(`${this.baseUrl}/${id}`);
  }
}
