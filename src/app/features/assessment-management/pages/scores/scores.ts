import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardInputDirective } from '@/shared/components/input';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ScoresImportDialog } from '../../components/scores-import-dialog/scores-import-dialog';
import { DataSource, SgaTemplate } from '@shared/widgets/data-source/data-source';
import { AssessmentStore } from '../../services/store/assessment.store';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import { DataSourceColumn } from '@core/types/data-source-types';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { AssessmentApi } from '../../services/assessment-api';
import { Toast } from '@core/services/toast';
import { map, of } from 'rxjs';
import { SectionCourseSelect } from '@/shared/widgets/selects';

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
  imports: [CommonModule, FormsModule, DataSource, SgaTemplate, ZardInputDirective, SelectOptionComponent, HeaderDetail, SectionCourseSelect],
  templateUrl: './scores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentScoresPage implements OnInit {
  public readonly store = inject(AssessmentStore);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly filters = inject(AssessmentFiltersService);
  private readonly toast = inject(Toast);
  private readonly dialog = inject(DialogModalService);
  private readonly assessmentApi = inject(AssessmentApi);

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

  public readonly headerConfig = computed<HeaderConfig>(() => ({
    title: 'Registro de calificaciones',
    subtitle: this.selectedAssessment()
      ? 'Administra notas por evaluación con edición rápida y contexto académico.'
      : 'Selecciona curso y evaluación para cargar la grilla editable de puntajes.',
    icon: 'fa-pen-to-square',
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
      key: 'import',
      label: 'Importar Excel',
      icon: 'fa-solid fa-file-import',
      color: 'secondary',
      typeAction: 'header',
      permissions: ['assessment-score:import'],
      disabled: !this.selectedAssessment() || this.studentScores().length === 0,
    },
    {
      key: 'save',
      label: 'Guardar notas',
      icon: this.store.loading() ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save',
      color: 'primary',
      typeAction: 'header',
      permissions: ['assessment-score:update'],
      disabled: !this.canSave() || this.store.loading(),
    },
  ]);

  public readonly scoreAverage = computed(() => {
    const rows = this.studentScores();
    if (!rows.length) return 0;
    const total = rows.reduce((acc, row) => acc + Number(row.score || 0), 0);
    return Number((total / rows.length).toFixed(1));
  });

  public readonly approvedCount = computed(() => this.studentScores().filter((row) => Number(row.score) >= 11).length);

  public readonly pendingCount = computed(() => this.studentScores().filter((row) => Number(row.score) <= 0).length);

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

  onHeaderAction(event: { action: ActionConfig }): void {
    if (event.action.key === 'clear') {
      this.clearFilters();
      return;
    }

    if (event.action.key === 'import') {
      this.openImportDialog();
      return;
    }

    if (event.action.key === 'save') {
      this.saveScores();
    }
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

  openImportDialog(): void {
    const assessmentId = this.selectedAssessment();
    const currentAssessment = this.store.assessments().find((item) => item.id === assessmentId);
    if (!assessmentId || !currentAssessment || this.studentScores().length === 0) {
      return;
    }

    const studentsInCourse = this.studentScores().map(s => String(s.studentCode || '').trim());
    const maxScore = Number(currentAssessment.maxScore || 20);

    this.dialog.open(ScoresImportDialog, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        maxScore,
        studentsInCourse,
        onImport: (mappedData: { studentCode: string; score: number; observation?: string }[]) => {
          const request = {
            assessmentId,
            scores: mappedData.map(d => {
              const match = this.studentScores().find(s => s.studentCode === d.studentCode);
              return {
                enrollmentId: match?.enrollmentId!,
                score: d.score,
                observation: d.observation || ''
              };
            })
          };

          this.assessmentApi.saveScoresBulk(request).subscribe({
            next: () => {
              this.toast.success('Notas importadas y guardadas correctamente');
              this.loadData(assessmentId);
            },
            error: (err: Error) => this.toast.error('Error al guardar notas importadas: ' + err.message)
          });
        }
      }
    });
  }
}
