import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthFacade } from '@auth/services/store/auth.acede';
import {
  ClassroomApi,
  type ClassroomGradeRecord,
  type ClassroomGradesResponse,
} from '../../services/classroom-api';
import { ClassroomStore } from '../../services/store/classroom.store';

@Component({
  selector: 'sga-classroom-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClassroomStore);
  private readonly api = inject(ClassroomApi);
  private readonly authFacade = inject(AuthFacade);

  readonly loading = signal(true);
  readonly records = signal<ClassroomGradeRecord[]>([]);
  readonly summary = signal<ClassroomGradesResponse['summary']>({
    assessments: 0,
    scores: 0,
    average: 0,
  });
  readonly selectedRecordId = signal<string | null>(null);
  readonly selectedStudentId = signal<string | null>(null);

  readonly selectedRecord = computed(() => {
    const selectedId = this.selectedRecordId();
    const items = this.records();
    return items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  });
  readonly profileType = computed(() => this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  readonly pageTitle = computed(() => {
    const type = this.profileType();
    if (type === 'student') return 'Mis calificaciones';
    if (type === 'guardian') return 'Calificaciones de vinculados';
    return 'Rendimiento del aula';
  });
  readonly pageDescription = computed(() => {
    const type = this.profileType();
    if (type === 'student') return 'Vista de tus evaluaciones y puntajes registrados.';
    if (type === 'guardian') return 'Vista de evaluaciones y puntajes de los estudiantes vinculados.';
    return 'Vista consolidada de evaluaciones registradas para este curso-seccion.';
  });
  readonly canViewStudentDetail = computed(() => {
    const type = this.profileType();
    return type === 'teacher' || type === 'admin' || type === 'director';
  });
  readonly studentOptions = computed(() => {
    const record = this.selectedRecord();
    return record?.scores ?? [];
  });
  readonly selectedStudent = computed(() => {
    const studentId = this.selectedStudentId();
    const items = this.studentOptions();
    return items.find((item) => item.studentId === studentId) ?? items[0] ?? null;
  });
  readonly selectedStudentHistory = computed(() => {
    const student = this.selectedStudent();
    if (!student) return [];

    return this.records()
      .map((record) => {
        const score = record.scores.find((item) => item.studentId === student.studentId);
        if (!score) return null;
        return {
          recordId: record.id,
          assessment: record.name,
          date: record.date,
          score: score.score,
          total: record.total,
          observation: score.observation,
        };
      })
      .filter(Boolean);
  });
  readonly selectedStudentAverage = computed(() => {
    const history = this.selectedStudentHistory();
    if (!history.length) return 0;
    return history.reduce((acc, item) => acc + item!.score, 0) / history.length;
  });

  ngOnInit(): void {
    const sectionCourseId =
      this.store.selectedSectionId() ??
      (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');

    if (!sectionCourseId) {
      this.loading.set(false);
      return;
    }

    this.api.getGrades(sectionCourseId).subscribe({
      next: (response) => {
        this.records.set(response?.data ?? []);
        this.summary.set(response?.summary ?? { assessments: 0, scores: 0, average: 0 });
        this.selectedRecordId.set(response?.data?.[0]?.id ?? null);
        this.selectedStudentId.set(response?.data?.[0]?.scores?.[0]?.studentId ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.records.set([]);
        this.summary.set({ assessments: 0, scores: 0, average: 0 });
        this.selectedRecordId.set(null);
        this.selectedStudentId.set(null);
        this.loading.set(false);
      },
    });
  }

  selectRecord(id: string) {
    this.selectedRecordId.set(id);
    const nextRecord = this.records().find((item) => item.id === id);
    this.selectedStudentId.set(nextRecord?.scores?.[0]?.studentId ?? null);
  }

  selectStudent(studentId: string) {
    this.selectedStudentId.set(studentId);
  }

  statusTone(value: number, total: number) {
    const ratio = total > 0 ? value / total : 0;
    if (ratio >= 0.85) return 'success';
    if (ratio >= 0.65) return 'info';
    return 'danger';
  }
}
