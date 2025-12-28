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

import { GradingSystem, Modality, AcademicYearStatus } from '../../types/year-academi-types';
import { Select } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { DatePicker } from '@shared/ui/date-picker/date-picker';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Input } from '@shared/ui/input/input';
import { InstitutionApi } from '@features/academic-setting/institution/services/api/institution-api';

@Component({
  selector: 'sga-year-academic-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Select, Button, DatePicker, Input],
  templateUrl: './year-academic-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearAcademicForm implements OnInit {
  private data = inject(DIALOG_DATA);
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private institutionApi = inject(InstitutionApi);

  public title = computed(() => this.data.title || 'Crear Año Académico');
  public subTitle = computed(() => this.data.subtitle || 'Complete el formulario para continuar');
  public form: FormGroup = this.fb.group({
    year: [null, [Validators.required, Validators.min(2000)]],
    name: ['', Validators.required],
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    modality: [Modality.IN_PERSON, Validators.required],
    gradingSystem: [GradingSystem.PERCENTAGE, Validators.required],
    passingDate: [null, Validators.required],
    passingGrade: [null, [Validators.required, Validators.min(0)]],
    academicCalendarUrl: ['', Validators.required],
    status: [AcademicYearStatus.PLANNED, Validators.required],
    institution: [null, Validators.required],
  });
  modalities = [
    { value: Modality.IN_PERSON, label: 'Presencial' },
    { value: Modality.VIRTUAL, label: 'Virtual' },
    { value: Modality.HYBRID, label: 'Híbrido' },
  ];
  gradingSystems = [
    { value: GradingSystem.PERCENTAGE, label: 'Porcentaje' },
    { value: GradingSystem.LETTER, label: 'Letra' },
    { value: GradingSystem.NUMERIC, label: 'Numérico' },
  ];
  statuses = [
    { value: AcademicYearStatus.PLANNED, label: 'Planificado' },
    { value: AcademicYearStatus.ACTIVE, label: 'Activo' },
    { value: AcademicYearStatus.CLOSED, label: 'Cerrado' },
  ];
  institutions = signal<{ value: string; label: string }[]>([]);

  ngOnInit() {
    this.institutionApi.getAll({}).subscribe((data) => {
      this.institutions.set(data.map((i) => ({ value: i.id, label: i.name })));
    });
  }

  onClose() {
    // Handle close action
    this.ref.close();
  }
}
