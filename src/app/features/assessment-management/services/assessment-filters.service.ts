import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AssessmentFiltersService {
  // Lista de evaluaciones
  readonly listSearch = signal('');

  // Registro de calificaciones
  readonly scoresSectionCourseId = signal('');
  readonly scoresAssessmentId = signal('');

  // Notas finales
  readonly gradesAssessmentId = signal('');

  setListSearch(value: string): void {
    this.listSearch.set((value ?? '').trim());
  }

  setScoresSectionCourseId(value: string): void {
    this.scoresSectionCourseId.set(value ?? '');
  }

  setScoresAssessmentId(value: string): void {
    this.scoresAssessmentId.set(value ?? '');
  }

  setGradesAssessmentId(value: string): void {
    this.gradesAssessmentId.set(value ?? '');
  }

  clearListFilters(): void {
    this.listSearch.set('');
  }

  clearScoresFilters(): void {
    this.scoresSectionCourseId.set('');
    this.scoresAssessmentId.set('');
  }

  clearGradesFilters(): void {
    this.gradesAssessmentId.set('');
  }
}
