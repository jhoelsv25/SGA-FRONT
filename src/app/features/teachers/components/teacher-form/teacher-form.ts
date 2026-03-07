import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select, SelectOption } from '@shared/ui/select/select';
import { TeacherStore } from '../../services/store/teacher.store';
import {
  Teacher,
  TeacherContractType,
  TeacherCreate,
  TeacherEmploymentStatus,
  TeacherLaborRegime,
  TeacherWorkloadType,
} from '../../types/teacher-types';

@Component({
  selector: 'sga-teacher-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input, Select],
  templateUrl: './teacher-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherForm implements OnInit {
  private store = inject(TeacherStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Teacher | null = null;
  readonly uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  readonly currentYear = new Date().getFullYear();

  contractTypeOptions: SelectOption[] = [
    { value: 'full_time' satisfies TeacherContractType, label: 'Tiempo completo' },
    { value: 'part_time' satisfies TeacherContractType, label: 'Medio tiempo' },
    { value: 'temporary' satisfies TeacherContractType, label: 'Temporal' },
    { value: 'permanent' satisfies TeacherContractType, label: 'Permanente' },
  ];
  laborRegimeOptions: SelectOption[] = [
    { value: 'public' satisfies TeacherLaborRegime, label: 'Público' },
    { value: 'private' satisfies TeacherLaborRegime, label: 'Privado' },
  ];
  workloadTypeOptions: SelectOption[] = [
    { value: '20_hours' satisfies TeacherWorkloadType, label: '20 horas' },
    { value: '30_hours' satisfies TeacherWorkloadType, label: '30 horas' },
    { value: '40_hours' satisfies TeacherWorkloadType, label: '40 horas' },
  ];
  employmentStatusOptions: SelectOption[] = [
    { value: 'active' satisfies TeacherEmploymentStatus, label: 'Activo' },
    { value: 'inactive' satisfies TeacherEmploymentStatus, label: 'Inactivo' },
    { value: 'on_leave' satisfies TeacherEmploymentStatus, label: 'Licencia' },
  ];

  private getEntityId(value: string | { id: string } | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.id;
  }

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      teacherCode: [this.current?.teacherCode ?? '', [Validators.required, Validators.maxLength(100)]],
      specialization: [this.current?.specialization ?? '', [Validators.required, Validators.maxLength(100)]],
      professionalTitle: [
        this.current?.professionalTitle ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      university: [this.current?.university ?? '', [Validators.required, Validators.maxLength(100)]],
      graduationYear: [
        this.current?.graduationYear ?? this.currentYear,
        [Validators.required, Validators.min(1900), Validators.max(this.currentYear + 1)],
      ],
      professionalLicense: [
        this.current?.professionalLicense ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      contractType: [this.current?.contractType ?? 'full_time', [Validators.required]],
      laborRegime: [this.current?.laborRegime ?? 'public', [Validators.required]],
      hireDate: [this.current?.hireDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), [Validators.required]],
      terminationDate: [this.current?.terminationDate?.slice(0, 10) ?? ''],
      workloadType: [this.current?.workloadType ?? '40_hours', [Validators.required]],
      weeklyHours: [this.current?.weeklyHours ?? 40, [Validators.required, Validators.min(1), Validators.max(100)]],
      teachingLevel: [this.current?.teachingLevel ?? '', [Validators.required, Validators.maxLength(100)]],
      employmentStatus: [this.current?.employmentStatus ?? 'active', [Validators.required]],
      institution: [
        this.getEntityId(this.current?.institution),
        [Validators.required, Validators.pattern(this.uuidPattern)],
      ],
      person: [
        this.getEntityId(this.current?.person),
        [Validators.required, Validators.pattern(this.uuidPattern)],
      ],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue() as TeacherCreate;
    const payload: TeacherCreate = {
      ...v,
      terminationDate: v.terminationDate || undefined,
    };
    if (this.current?.id) {
      this.store.update(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
      });
    } else {
      this.store.create(payload).subscribe({
        next: () => this.ref.close(),
      });
    }
  }

  close() {
    this.ref.close();
  }
}
