import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { CompetencySelect, PeriodSelect, SectionCourseSelect } from '@/shared/widgets/selects';
import { AssessmentApi } from '../../services/assessment-api';
import { Assessment, AssessmentUpsertPayload } from '../../types/assessment-types';
import { PeriodApi } from '../../../periods/services/period-api';
import { SectionCourseApi } from '../../../section-courses/services/section-course-api';
import { CompetencyApi } from '../../../competencies/services/competency-api';
import type { DataResponse } from '@core/types/pagination-types';
import type { Period } from '../../../periods/types/period-types';
import type { SectionCourse } from '../../../section-courses/types/section-course-types';
import type { Competency } from '../../../competencies/types/competency-types';

type LocalSelectOption = { value: string | number; label: string };

@Component({
  selector: 'sga-assessment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardDatePickerComponent,
    ZardInputDirective,
    SelectOptionComponent,
    SectionCourseSelect,
    PeriodSelect,
    CompetencySelect,
  ],
  templateUrl: './assessment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssessmentApi);
  private readonly periodApi = inject(PeriodApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly competencyApi = inject(CompetencyApi);
  private readonly ref = inject(ZardDialogRef);
  private readonly data = inject<{ current?: Assessment | null }>(Z_MODAL_DATA, { optional: true });

  readonly current = this.data?.current ?? null;
  readonly saving = signal(false);
  readonly loadingOptions = signal(false);
  readonly periodOptions = signal<LocalSelectOption[]>([]);
  readonly sectionCourseOptions = signal<LocalSelectOption[]>([]);
  readonly competencyOptions = signal<LocalSelectOption[]>([]);
  readonly sectionCourses = signal<SectionCourse[]>([]);
  readonly allCompetencies = signal<Competency[]>([]);

  readonly typeOptions: LocalSelectOption[] = [
    { value: 'formative', label: 'Formativa' },
    { value: 'summative', label: 'Sumativa' },
    { value: 'diagnostic', label: 'Diagnóstica' },
  ];

  readonly statusOptions: LocalSelectOption[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'completed', label: 'Completada' },
    { value: 'reviewed', label: 'Revisada' },
  ];

  readonly scoreScaleOptions: LocalSelectOption[] = [
    { value: 20, label: 'Escala sobre 20' },
    { value: 100, label: 'Escala sobre 100' },
    { value: 10, label: 'Escala sobre 10' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    assessmentDate: [null as Date | null, [Validators.required]],
    weightPercentage: [25, [Validators.required, Validators.min(1), Validators.max(100)]],
    maxScore: [20, [Validators.required, Validators.min(1)]],
    type: ['formative' as AssessmentUpsertPayload['type'], [Validators.required]],
    status: ['pending' as AssessmentUpsertPayload['status'], [Validators.required]],
    period: ['', [Validators.required]],
    sectionCourse: ['', [Validators.required]],
    competency: [''],
  });

  ngOnInit(): void {
    this.patchCurrent();
    this.loadOptions();
    this.form.controls.sectionCourse.valueChanges.subscribe(() => {
      this.refreshCompetencyOptions();
    });
  }

  private patchCurrent(): void {
    if (!this.current) return;
    this.form.patchValue({
      name: this.current.name ?? '',
      description: this.current.description ?? '',
      assessmentDate: this.current.assessmentDate ? new Date(this.current.assessmentDate) : null,
      weightPercentage: Number(this.current.weightPercentage ?? 25),
      maxScore: Number(this.current.maxScore ?? 20),
      type: this.current.type ?? 'formative',
      status: this.current.status ?? 'pending',
      period: this.current.period?.id ?? '',
      sectionCourse: this.current.sectionCourse?.id ?? '',
      competency: this.current.competency?.id ?? '',
    });
  }

  private loadOptions(): void {
    this.loadingOptions.set(true);
    this.periodApi.getAll({ size: 200 }).subscribe({
      next: (response: DataResponse<Period>) => {
        this.periodOptions.set(
          (response.data ?? []).map((item: Period) => ({
            value: item.id,
            label: `${item.name}${item.yearAcademic?.name ? ` · ${item.yearAcademic.name}` : ''}`,
          })),
        );
      },
    });
    this.sectionCourseApi.getAll({ size: 300 }).subscribe({
      next: (response: DataResponse<SectionCourse>) => {
        this.sectionCourses.set(response.data ?? []);
        this.sectionCourseOptions.set(
          (response.data ?? []).map((item: SectionCourse) => ({
            value: item.id,
            label: `${item.course?.name ?? 'Curso'} · ${item.section?.name ?? 'Sección'}${item.academicYear?.name ? ` · ${item.academicYear.name}` : ''}`,
          })),
        );
        this.refreshCompetencyOptions();
        this.loadingOptions.set(false);
      },
      error: () => {
        this.loadingOptions.set(false);
      },
    });
    this.competencyApi.getAll({ size: 300 }).subscribe({
      next: (response: DataResponse<Competency>) => {
        this.allCompetencies.set(response.data ?? []);
        this.refreshCompetencyOptions();
      },
    });
  }

  private refreshCompetencyOptions(): void {
    const selectedSectionCourseId = this.form.controls.sectionCourse.value;
    const selectedSectionCourse = this.sectionCourses().find((item) => item.id === selectedSectionCourseId);
    const courseId = selectedSectionCourse?.course?.id;

    const availableCompetencies = this.allCompetencies().filter((item) => {
      if (!courseId) return true;
      return item.course?.id === courseId;
    });

    this.competencyOptions.set([
      { value: '', label: 'Sin competencia' },
      ...availableCompetencies.map((item: Competency) => ({
        value: item.id,
        label: `${item.code} · ${item.name}${item.course?.name ? ` · ${item.course.name}` : ''}`,
      })),
    ]);

    const currentCompetency = this.form.controls.competency.value;
    if (currentCompetency && !availableCompetencies.some((item) => item.id === currentCompetency)) {
      this.form.controls.competency.setValue('');
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: AssessmentUpsertPayload = {
      name: raw.name ?? '',
      description: raw.description?.trim() || undefined,
      assessmentDate: this.formatDate(raw.assessmentDate),
      weightPercentage: Number(raw.weightPercentage),
      maxScore: Number(raw.maxScore),
      type: raw.type as AssessmentUpsertPayload['type'],
      status: raw.status as AssessmentUpsertPayload['status'],
      period: raw.period ?? '',
      sectionCourse: raw.sectionCourse ?? '',
      competency: raw.competency || undefined,
    };

    this.saving.set(true);
    const request = this.current?.id
      ? this.api.update(this.current.id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  close(): void {
    this.ref.close();
  }

  private formatDate(value: Date | string | null): string {
    if (!value) return new Date().toISOString();
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }
}
