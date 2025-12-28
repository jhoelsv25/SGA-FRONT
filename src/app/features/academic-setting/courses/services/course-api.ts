import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Course } from '../types/course-types';

@Injectable({ providedIn: 'root' })
export class CourseApi {
  getAll(): Observable<Course[]> {
    return of([]); // TODO: Implement real API call
  }
  // ...other CRUD methods
}
