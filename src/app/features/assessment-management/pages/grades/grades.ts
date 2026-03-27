import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentStore } from '../../services/store/assessment.store';
import { type Assessment, type AssessmentScore, type PeriodCompetencyGrade } from '../../types/assessment-types';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { AssessmentApi } from '../../services/assessment-api';

type ScoreRow = Pick<AssessmentScore, 'enrollmentId' | 'score' | 'observation'> & { studentName: string };

@Component({
  selector: 'sga-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOptionComponent, HeaderDetail],
  templateUrl: './grades.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades implements OnInit {
  public readonly assessmentStore = inject(AssessmentStore);
  private readonly assessmentApi = inject(AssessmentApi);
  private readonly filters = inject(AssessmentFiltersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public selectedAssessmentId = signal<string>('');
  public localScores = signal<ScoreRow[]>([]);
  public consolidatedRows = signal<PeriodCompetencyGrade[]>([]);
  public assessmentOptions = signal<SelectOption[]>([]);
  public hasActiveFilters = signal(false);
  public enrollmentContextId = signal('');
  public studentContextName = signal('');
  public consolidationLoading = signal(false);
  public visibleScores = computed(() =>
    this.localScores().filter((score) => !this.enrollmentContextId() || score.enrollmentId === this.enrollmentContextId()),
  );
  public readonly selectedAssessment = computed<Assessment | null>(() =>
    this.assessmentStore.assessments().find((assessment) => assessment.id === this.selectedAssessmentId()) ?? null,
  );
  public readonly canShowConsolidated = computed(
    () => Boolean(this.selectedAssessment()?.period?.id && this.selectedAssessment()?.sectionCourse?.id && this.selectedAssessment()?.competency?.id),
  );
  public readonly headerConfig = computed<HeaderConfig>(() => ({
    title: 'Notas finales',
    subtitle: this.selectedAssessmentId()
      ? 'Consolida y ajusta notas finales con observaciones por estudiante.'
      : 'Selecciona una evaluación para revisar el consolidado final.',
    icon: 'fa-chart-line',
    showFilters: true,
    showActions: true,
  }));
  public readonly headerActions = computed<ActionConfig[]>(() => [
    {
      key: 'clear',
      label: 'Limpiar',
      icon: 'fa-solid fa-filter-circle-xmark',
      color: 'secondary',
      typeAction: 'header',
      disabled: !this.hasActiveFilters(),
    },
    {
      key: 'save',
      label: 'Guardar cambios',
      icon: this.assessmentStore.loading() ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save',
      color: 'primary',
      typeAction: 'header',
      disabled: !this.selectedAssessmentId() || this.assessmentStore.loading(),
    },
  ]);
  public readonly averageScore = computed(() => {
    const rows = this.visibleScores();
    if (!rows.length) return 0;
    const total = rows.reduce((acc, score) => acc + Number(score.score || 0), 0);
    return Number((total / rows.length).toFixed(1));
  });
  public readonly approvedCount = computed(() => this.visibleScores().filter((score) => Number(score.score) >= 11).length);
  public readonly observedCount = computed(() => this.visibleScores().filter((score) => !!String(score.observation ?? '').trim()).length);
  public readonly consolidatedAverage = computed(() => {
    const rows = this.consolidatedRows();
    if (!rows.length) return 0;
    const total = rows.reduce((acc, row) => acc + Number(row.numericScore || 0), 0);
    return Number((total / rows.length).toFixed(2));
  });
  public readonly consolidatedApprovedCount = computed(
    () => this.consolidatedRows().filter((row) => Number(row.numericScore) >= 11).length,
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.enrollmentContextId.set(params.get('enrollmentId') ?? '');
      this.studentContextName.set(params.get('studentName') ?? '');
    });
    this.assessmentStore.loadAll({});
  }

  onHeaderAction(event: { action: ActionConfig }): void {
    if (event.action.key === 'clear') {
      this.clearFilters();
      return;
    }

    if (event.action.key === 'save') {
      this.saveGrades();
    }
  }

  constructor() {
    effect(() => {
      const assessments = this.assessmentStore.assessments();
      this.assessmentOptions.set([
        { value: '', label: 'Seleccione una evaluación...' },
        ...assessments.map((a: Assessment) => ({
          value: a.id,
          label: `${a.name} - ${a.sectionCourse?.course?.name ?? ''} (${a.sectionCourse?.id ?? ''})`,
        }))]);

      const options = this.assessmentOptions().filter((o) => o.value);
      if (options.length === 0) return;

      const saved = this.filters.gradesAssessmentId();
      const fallback = options[0]?.value?.toString() ?? '';
      const next = (saved && options.some((o) => o.value?.toString() === saved)) ? saved : fallback;

      if (next && next !== this.selectedAssessmentId()) {
        this.onAssessmentChange(next);
      }
    });
    effect(() => {
      const scores = this.assessmentStore.activeScores();
      const id = this.selectedAssessmentId();
      if (id && scores.length > 0) {
        this.syncScoresFromStore(scores);
      }
      if (id && scores.length === 0) {
        this.localScores.set([]);
      }
    });
    effect(() => {
      const assessment = this.selectedAssessment();
      const enrollmentId = this.enrollmentContextId();
      if (!assessment?.id) {
        this.consolidatedRows.set([]);
        return;
      }
      if (!assessment.period?.id || !assessment.sectionCourse?.id || !assessment.competency?.id) {
        this.consolidatedRows.set([]);
        return;
      }
      this.loadConsolidatedGrades({
        period: assessment.period.id,
        sectionCourse: assessment.sectionCourse.id,
        competency: assessment.competency.id,
        enrollment: enrollmentId || undefined,
      });
    });
  }

  onAssessmentChange(value: unknown): void {
    const id = value === null || value === undefined ? '' : String(value);
    this.selectedAssessmentId.set(id);
    this.hasActiveFilters.set(Boolean(id));
    this.filters.setGradesAssessmentId(id);
    this.localScores.set([]);
    this.consolidatedRows.set([]);
    if (id) {
      this.assessmentStore.loadScores(id);
    }
  }

  syncScoresFromStore(scores: AssessmentScore[]) {
    this.localScores.set(scores.map(s => ({
      enrollmentId: s.enrollmentId,
      studentName: s.studentName ?? '',
      score: s.score,
      observation: s.observation ?? ''
    })));
  }

  saveGrades() {
    const request = {
      assessmentId: this.selectedAssessmentId(),
      scores: this.localScores().map(s => ({
        enrollmentId: s.enrollmentId,
        score: s.score,
        observation: s.observation
      }))
    };
    
    this.assessmentStore.saveScores(request).subscribe({
      next: () => {
        const assessment = this.selectedAssessment();
        if (assessment?.period?.id && assessment.sectionCourse?.id && assessment.competency?.id) {
          this.loadConsolidatedGrades({
            period: assessment.period.id,
            sectionCourse: assessment.sectionCourse.id,
            competency: assessment.competency.id,
            enrollment: this.enrollmentContextId() || undefined,
          });
        }
      },
    });
  }

  updateScore(enrollmentId: string, score: number) {
    this.localScores.update(prev => 
      prev.map(s => s.enrollmentId === enrollmentId ? { ...s, score } : s)
    );
  }

  updateObservation(enrollmentId: string, observation: string) {
    this.localScores.update(prev => 
      prev.map(s => s.enrollmentId === enrollmentId ? { ...s, observation } : s)
    );
  }

  getSelectedAssessmentLabel(): string {
    const selected = this.selectedAssessmentId();
    return this.assessmentOptions().find((o) => String(o.value ?? '') === selected)?.label ?? '';
  }

  clearFilters(): void {
    this.filters.clearGradesFilters();
    this.selectedAssessmentId.set('');
    this.hasActiveFilters.set(false);
    this.localScores.set([]);
    this.consolidatedRows.set([]);
  }

  clearEnrollmentContext(): void {
    this.router.navigate(['/assessments/grades'], {
      queryParams: {
        enrollmentId: null,
        studentName: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadConsolidatedGrades(params: {
    enrollment?: string;
    period?: string;
    competency?: string;
    sectionCourse?: string;
    academicYear?: string;
  }): void {
    this.consolidationLoading.set(true);
    this.assessmentApi.getConsolidatedGrades(params).subscribe({
      next: (response) => {
        this.consolidatedRows.set(response.data ?? []);
        this.consolidationLoading.set(false);
      },
      error: () => {
        this.consolidatedRows.set([]);
        this.consolidationLoading.set(false);
      },
    });
  }

  public getStudentLabel(row: PeriodCompetencyGrade): string {
    const person = row.enrollment?.student?.person;
    const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
    return name || row.enrollment?.student?.studentCode || 'Estudiante sin nombre';
  }
}
