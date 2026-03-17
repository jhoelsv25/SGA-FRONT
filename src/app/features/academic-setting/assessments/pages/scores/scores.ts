import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { DataSource, SgaTemplate } from '@shared/widgets/data-source/data-source';

import { AssessmentStore } from '../../services/store/assessment.store';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';
import { SectionCourseApi } from '@features/organization/section-courses/services/section-course-api';
import { DataSourceColumn } from '@core/types/data-source-types';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';

type ScoreRow = {
  id?: string;
  enrollmentId: string;
  studentName: string;
  studentCode: string;
  score: number;
  observation: string;
};


@Component({
  selector: 'sga-assessment-scores',
  standalone: true,
  imports: [CommonModule, FormsModule, DataSource, SgaTemplate, ZardInputDirective, SelectOptionComponent, ZardButtonComponent, ListToolbarComponent],
  templateUrl: './scores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentScoresPage implements OnInit {
  public readonly store = inject(AssessmentStore);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly filters = inject(AssessmentFiltersService);

  public selectedSectionCourse = signal<string>('');
  public selectedAssessment = signal<string>('');

  public sectionCourseOptions = signal<SelectOption[]>([]);
  public studentScores = signal<ScoreRow[]>([]);

  public columns: DataSourceColumn[] = [
    { key: 'studentCode', label: 'Código', width: '120px' },
    { key: 'studentName', label: 'Estudiante', sortable: true },
    { key: 'score', label: 'Calificación', width: '150px', type: 'custom', customTemplate: 'scoreTemplate' },
    { key: 'observation', label: 'Observación', type: 'custom', customTemplate: 'observationTemplate' }];

  public canSave = computed(() => this.selectedAssessment() && this.studentScores().length > 0);
  public hasActiveFilters = computed(() => Boolean(this.selectedSectionCourse() || this.selectedAssessment()));

  public filteredAssessments = computed(() => {
    return this.store.assessments().map((a) => ({
      value: a.id,
      label: `${a.name} (${a.weightPercentage}%)`,
    }));
  });

  public selectedSectionLabel = computed(() => {
    const selected = this.selectedSectionCourse();
    return this.sectionCourseOptions().find((o) => String(o.value ?? '') === selected)?.label ?? '';
  });

  public selectedAssessmentLabel = computed(() => {
    const selected = this.selectedAssessment();
    return this.filteredAssessments().find((o) => String(o.value ?? '') === selected)?.label ?? '';
  });

  constructor() {
    // Aplica selección previa guardada de sección
    effect(() => {
      const savedSection = this.filters.scoresSectionCourseId();
      const currentSection = this.selectedSectionCourse();
      if (savedSection && savedSection !== currentSection) {
        this.selectedSectionCourse.set(savedSection);
      }
    });

    // Si hay evaluaciones disponibles, selecciona evaluación válida (guardada o primera)
    effect(() => {
      const sectionId = this.selectedSectionCourse();
      const options = this.filteredAssessments();
      if (!sectionId || options.length === 0) return;

      const saved = this.filters.scoresAssessmentId();
      const fallback = options[0]?.value?.toString() ?? '';
      const nextAssessment =
        saved && options.some((o) => o.value?.toString() === saved) ? saved : fallback;

      if (nextAssessment && nextAssessment !== this.selectedAssessment()) {
        this.onAssessmentChange(nextAssessment);
      }
    });

    // Sincroniza notas existentes del backend con las filas locales
    effect(() => {
      const scores = this.store.activeScores();
      if (scores.length === 0) return;

      this.studentScores.update((rows) =>
        rows.map((row) => {
          const found = scores.find((s) => s.enrollmentId === row.enrollmentId);
          return found
            ? {
                ...row,
                id: found.id,
                score: found.score,
                observation: found.observation ?? '',
              }
            : row;
        }),
      );
    });
  }

  ngOnInit(): void {
    this.loadSectionCourses();
  }

  private loadSectionCourses(): void {
    this.sectionCourseApi.getAll().subscribe({
      next: (res) => {
        this.sectionCourseOptions.set(
          res.data.map((sc) => ({
            value: sc.id,
            label: `${sc.course?.name || 'CP'} - ${sc.section?.name || 'S'}`,
          })),
        );

        const options = this.sectionCourseOptions();
        const saved = this.filters.scoresSectionCourseId();
        const fallback = options[0]?.value?.toString() ?? '';
        const nextSection = saved && options.some((o) => o.value?.toString() === saved) ? saved : fallback;

        if (nextSection) {
          this.onSectionCourseChange(nextSection);
        }
      },
    });
  }

  onSectionCourseChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedSectionCourse.set(id);
    this.filters.setScoresSectionCourseId(id);
    this.selectedAssessment.set('');
    this.filters.setScoresAssessmentId('');
    this.studentScores.set([]);

    if (id) {
      this.store.loadAll({ sectionCourse: id });
    }
  }

  onAssessmentChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedAssessment.set(id);
    this.filters.setScoresAssessmentId(id);

    if (!id) {
      this.studentScores.set([]);
      return;
    }

    this.loadData(id);
  }

  private loadData(assessmentId: string): void {
    const scId = this.selectedSectionCourse();

    this.enrollmentApi.getAll({ sectionCourse: scId }).subscribe({
      next: (enrollmentRes) => {
        const baseRows: ScoreRow[] = enrollmentRes.data.map((e) => ({
          enrollmentId: e.id,
          studentName:
            `${e.student?.person?.firstName || ''} ${e.student?.person?.lastName || ''}`.trim() ||
            e.student?.studentCode,
          studentCode: e.student?.studentCode,
          score: 0,
          observation: '',
        }));

        this.studentScores.set(baseRows);
        this.store.loadScores(assessmentId);
      },
    });
  }

  saveScores(): void {
    if (!this.selectedAssessment()) return;

    const request = {
      assessmentId: this.selectedAssessment(),
      scores: this.studentScores().map((s) => ({
        enrollmentId: s.enrollmentId,
        score: s.score,
        observation: s.observation,
      })),
    };

    this.store.saveScores(request).subscribe();
  }

  clearFilters(): void {
    this.filters.clearScoresFilters();
    this.selectedSectionCourse.set('');
    this.selectedAssessment.set('');
    this.studentScores.set([]);
    this.store.loadAll({});
  }
}
