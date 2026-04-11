import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  input,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '@auth/services/store/auth.acede';

import {
  AcademicYearStatus,
  GradingSystem,
  Modality,
  YearAcademic,
  YearAcademicGradeScale,
} from '../../types/year-academi-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import { YearAcademicStore } from '../../services/store/year-academic.store';
import { InstitutionSelect } from '@/shared/widgets/selects';

@Component({
  selector: 'sga-year-academic-form',

  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SelectOptionComponent,
    ZardButtonComponent,
    ZardDatePickerComponent,
    ZardInputDirective,
    InstitutionSelect,
  ],
  templateUrl: './year-academic-form.html',
  styleUrls: ['./year-academic-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearAcademicForm implements OnInit {
  private data = inject(Z_MODAL_DATA);
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private institutionApi = inject(InstitutionApi);
  private store = inject(YearAcademicStore);
  private authFacade = inject(AuthFacade);
  saving = signal(false);

  public title = computed(() => this.data.title || 'Crear Año Académico');
  public subTitle = computed(() => this.data.subtitle || 'Complete el formulario para continuar');
  public isEditing = computed(() => !!this.data.current);
  public form: FormGroup = this.fb.group({
    year: [null, [Validators.required, Validators.min(1900)]],
    name: ['', Validators.required],
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    modality: [Modality.IN_PERSON as Modality, Validators.required],
    gradingSystem: [GradingSystem.PERCENTAGE as GradingSystem, Validators.required],
    passingDate: [null, Validators.required],
    passingGrade: ['', [Validators.required, Validators.maxLength(50)]],
    academicCalendarUrl: [''],
    status: [AcademicYearStatus.PLANNED as AcademicYearStatus, Validators.required],
    institution: [null, Validators.required],
    periodCount: [4, [Validators.min(0)]],
  });
  modalities = [
    { value: Modality.IN_PERSON, label: 'Presencial' },
    { value: Modality.ONLINE, label: 'Virtual' },
    { value: Modality.HYBRID, label: 'Híbrido' },
  ];
  gradingSystems = [
    { value: GradingSystem.PERCENTAGE, label: 'Porcentaje' },
    { value: GradingSystem.LETTER, label: 'Letra' },
    { value: GradingSystem.GPA, label: 'GPA' },
  ];
  statuses = [
    { value: AcademicYearStatus.PLANNED, label: 'Planificado' },
    { value: AcademicYearStatus.ONGOING, label: 'En curso' },
    { value: AcademicYearStatus.COMPLETED, label: 'Cerrado' },
    { value: AcademicYearStatus.CANCELLED, label: 'Cancelado' },
  ];
  gradeScales = signal<YearAcademicGradeScale[]>([]);
  passingGradeLabel = computed(() => {
    switch (this.form.get('gradingSystem')?.value) {
      case GradingSystem.LETTER:
        return 'Mínimo aprobatorio';
      case GradingSystem.GPA:
        return 'GPA mínimo aprobatorio';
      default:
        return 'Nota mínima aprobatoria';
    }
  });

  readonly showGradeScaleTable = computed(
    () => this.form.get('gradingSystem')?.value === GradingSystem.LETTER,
  );
  passingGradePlaceholder = computed(() => {
    switch (this.form.get('gradingSystem')?.value) {
      case GradingSystem.LETTER:
        return 'Ej: A, B o AD';
      case GradingSystem.GPA:
        return 'Ej: 2.5 o 3.0';
      default:
        return 'Ej: 11 o 15-17';
    }
  });

  private getEntityId(value: string | { id: string } | null | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.id;
  }

  private resolveDefaultInstitutionId(options: { value: string; label: string }[]): string | null {
    const currentUser = this.authFacade.getCurrentUser();
    const profileInstitutionId = (currentUser?.profile?.institutionId ?? '').trim().toLowerCase();
    const profileInstitution = (
      currentUser?.profile?.institutionName ??
      currentUser?.profile?.institution ??
      ''
    )
      .trim()
      .toLowerCase();

    if (!profileInstitution && options.length === 1) {
      return options[0].value;
    }

    if (profileInstitutionId) {
      const byExplicitId = options.find(
        (option) => option.value.toLowerCase() === profileInstitutionId,
      );
      if (byExplicitId) return byExplicitId.value;
    }

    if (!profileInstitution) return null;

    const byId = options.find((option) => option.value.toLowerCase() === profileInstitution);
    if (byId) return byId.value;

    const byLabel = options.find(
      (option) => option.label.trim().toLowerCase() === profileInstitution,
    );
    if (byLabel) return byLabel.value;

    return options.length === 1 ? options[0].value : null;
  }

  ngOnInit() {
    this.institutionApi.getAll({}).subscribe((data) => {
      const institutionOptions = data.map((i) => ({ value: i.id, label: i.name }));
      const current = this.data.current as YearAcademic | null | undefined;
      if (current) {
        this.form.patchValue({
          year: current.year,
          name: current.name,
          startDate: current.startDate ? new Date(current.startDate) : null,
          endDate: current.endDate ? new Date(current.endDate) : null,
          modality: current.modality,
          gradingSystem: current.gradingSystem,
          passingDate: current.passingDate ? new Date(current.passingDate) : null,
          passingGrade: current.passingGrade,
          academicCalendarUrl: current.academicCalendarUrl ?? '',
          status: current.status,
          institution: this.getEntityId(current.institution as string | { id: string } | undefined),
          periodCount: current.periods?.length ?? current.periodCount ?? 0,
        });
        this.gradeScales.set(
          current.gradeScales?.length
            ? current.gradeScales.map((scale, index) => ({
                label: scale.label,
                minScore: Number(scale.minScore),
                maxScore: Number(scale.maxScore),
                orderIndex: scale.orderIndex ?? index + 1,
              }))
            : [
                { label: 'AD', minScore: 18, maxScore: 20, orderIndex: 1 },
                { label: 'A', minScore: 14, maxScore: 17, orderIndex: 2 },
                { label: 'B', minScore: 11, maxScore: 13, orderIndex: 3 },
                { label: 'C', minScore: 0, maxScore: 10, orderIndex: 4 },
              ],
        );
        this.form.get('periodCount')?.disable({ emitEvent: false });
      } else {
        this.gradeScales.set([
          { label: 'AD', minScore: 18, maxScore: 20, orderIndex: 1 },
          { label: 'A', minScore: 14, maxScore: 17, orderIndex: 2 },
          { label: 'B', minScore: 11, maxScore: 13, orderIndex: 3 },
          { label: 'C', minScore: 0, maxScore: 10, orderIndex: 4 },
        ]);
        const defaultInstitutionId = this.resolveDefaultInstitutionId(institutionOptions);
        if (defaultInstitutionId) {
          this.form.patchValue({ institution: defaultInstitutionId });
        }
      }
    });
  }

  addGradeScale() {
    this.gradeScales.update((current) => [
      ...current,
      { label: '', minScore: 0, maxScore: 0, orderIndex: current.length + 1 },
    ]);
  }

  removeGradeScale(index: number) {
    this.gradeScales.update((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, orderIndex: itemIndex + 1 })),
    );
  }

  updateGradeScale(index: number, patch: Partial<YearAcademicGradeScale>) {
    this.gradeScales.update((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  onClose() {
    this.ref.close();
  }

  /** Formatea Date a YYYY-MM-DD para el backend */
  private toDateString(d: Date | null): string | undefined {
    if (!d) return undefined;
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toISOString().slice(0, 10);
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const basePayload = {
      ...raw,
      year: Math.floor(Number(raw.year)),
      passingGrade: String(raw.passingGrade ?? '').trim(),
      startDate: this.toDateString(raw.startDate),
      endDate: this.toDateString(raw.endDate),
      passingDate: this.toDateString(raw.passingDate),
      academicCalendarUrl: raw.academicCalendarUrl ?? '',
      periodCount: Math.max(0, Math.floor(Number(raw.periodCount ?? 0))),
      gradeScales:
        raw.gradingSystem === GradingSystem.LETTER
          ? this.gradeScales()
              .filter((scale) => scale.label.trim())
              .map((scale, index) => ({
                label: scale.label.trim(),
                minScore: Number(scale.minScore),
                maxScore: Number(scale.maxScore),
                orderIndex: index + 1,
              }))
          : [],
    };
    const current = this.data.current as YearAcademic | null | undefined;
    const payload = current?.id
      ? {
          ...basePayload,
          periodCount: undefined,
        }
      : basePayload;
    this.saving.set(true);
    const request = current?.id
      ? this.store.update(current.id, payload)
      : this.store.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close(payload);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
