import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Competency } from '../types/competency-types';

@Injectable({ providedIn: 'root' })
export class CompetencyApi {
  getAll(): Observable<Competency[]> {
    return of([]); // TODO: Implement real API call
  }
  // ...other CRUD methods
}
