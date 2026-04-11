export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import {
  CompetencySelect,
  PeriodSelect,
  SectionCourseSelect,
  StudentSelect,
} from '@/shared/widgets/selects';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportStore } from '../../services/store/report.store';
import { Report, ReportCreate } from '../../types/report-types';

@Component({
  selector: 'sga-report-form',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
    SectionCourseSelect,
    PeriodSelect,
    CompetencySelect,
    StudentSelect,
  ],
  templateUrl: './report-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportForm implements OnInit {
  private store = inject(ReportStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Report | null = null;
  selectedSectionCourseId = signal<string | null>(null);
  isAcademicReport = computed(() => this.form?.get('type')?.value === 'academic');

  typeOptions: LocalSelectOption[] = [
    { value: 'academic', label: 'Académico' },
    { value: 'attendance', label: 'Asistencia' },
    { value: 'payments', label: 'Pagos' },
    { value: 'behavior', label: 'Conducta' },
    { value: 'enrollment', label: 'Matrículas' },
    { value: 'custom', label: 'Personalizado' },
    { value: 'other', label: 'Otro' },
  ];

  formatOptions: LocalSelectOption[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    const currentParameters = (this.current?.parameters ?? {}) as Record<string, unknown>;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      type: [this.current?.type ?? 'academic', [Validators.required]],
      format: [this.current?.format ?? 'pdf'],
      sectionCourse: [
        typeof currentParameters['sectionCourse'] === 'string'
          ? currentParameters['sectionCourse']
          : null,
      ],
      period: [
        typeof currentParameters['period'] === 'string' ? currentParameters['period'] : null,
      ],
      competency: [
        typeof currentParameters['competency'] === 'string'
          ? currentParameters['competency']
          : null,
      ],
      student: [
        typeof currentParameters['student'] === 'string' ? currentParameters['student'] : null,
      ],
    });
    this.selectedSectionCourseId.set(this.form.get('sectionCourse')?.value ?? null);

    this.form.get('type')?.valueChanges.subscribe((value) => {
      if (value !== 'academic') {
        this.form.patchValue(
          { sectionCourse: null, period: null, competency: null, student: null },
          { emitEvent: false },
        );
        this.selectedSectionCourseId.set(null);
      }
    });

    this.form.get('sectionCourse')?.valueChanges.subscribe((value) => {
      this.selectedSectionCourseId.set(value ?? null);
      if (!value) {
        this.form.patchValue({ competency: null }, { emitEvent: false });
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const v: ReportCreate = {
      name: raw.name,
      type: raw.type,
      format: raw.format,
      parameters:
        raw.type === 'academic'
          ? {
              sectionCourse: raw.sectionCourse || null,
              period: raw.period || null,
              competency: raw.competency || null,
              student: raw.student || null,
            }
          : undefined,
    };
    if (this.current?.id) {
      this.store.update(this.current.id, v);
      this.ref.close();
    } else {
      this.store.create(v);
      this.ref.close();
    }
  }

  close() {
    this.ref.close();
  }
}
