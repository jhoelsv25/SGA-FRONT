import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AcademicYearStatus, GradingSystem, Modality, YearAcademic } from '../../types/year-academi-types';
import { Select } from '@shared/adapters/ui/select/select';
import { Button } from '@shared/directives';
import { DatePicker } from '@shared/widgets/ui/date-picker/date-picker';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { Input } from '@shared/adapters/ui/input/input';
import { InstitutionApi } from '@features/administration/services/api/institution-api';
import { YearAcademicStore } from '../../services/store/year-academic.store';

@Component({
  selector: 'sga-year-academic-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Select, Button, DatePicker, Input],
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
  saving = signal(false);

  public title = computed(() => this.data.title || 'Crear Año Académico');
  public subTitle = computed(() => this.data.subtitle || 'Complete el formulario para continuar');
  public form: FormGroup = this.fb.group({
    year: [null, [Validators.required, Validators.min(1900)]],
    name: ['', Validators.required],
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    modality: [Modality.IN_PERSON as Modality, Validators.required],
    gradingSystem: [GradingSystem.PERCENTAGE as GradingSystem, Validators.required],
    passingDate: [null, Validators.required],
    passingGrade: [null, [Validators.required, Validators.min(0)]],
    academicCalendarUrl: [''],
    status: [AcademicYearStatus.PLANNED as AcademicYearStatus, Validators.required],
    institution: [null, Validators.required],
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
  institutions = signal<{ value: string; label: string }[]>([]);

  ngOnInit() {
    this.institutionApi.getAll({}).subscribe((data) => {
      this.institutions.set(data.map((i) => ({ value: i.id, label: i.name })));
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
          institution: current.institution,
        });
      }
    });
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
    const payload = {
      ...raw,
      year: Math.floor(Number(raw.year)),
      passingGrade: Math.floor(Number(raw.passingGrade)),
      startDate: this.toDateString(raw.startDate),
      endDate: this.toDateString(raw.endDate),
      passingDate: this.toDateString(raw.passingDate),
      academicCalendarUrl: raw.academicCalendarUrl ?? '',
    };
    const current = this.data.current as YearAcademic | null | undefined;
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
