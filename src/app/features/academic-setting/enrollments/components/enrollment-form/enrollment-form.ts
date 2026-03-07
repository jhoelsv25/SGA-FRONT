import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { SectionSelect, YearAcademicSelect } from '@shared/components/selects';
import { EnrollmentStore } from '../../services/store/enrollment.store';
import { Enrollment } from '../../types/enrollment-types';
import { StudentApi } from '@features/students/services/api/student-api';
import type { SelectOption } from '@shared/ui/select/select';

@Component({
  selector: 'sga-enrollment-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Select, Input, SectionSelect, YearAcademicSelect],
  templateUrl: './enrollment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentForm implements OnInit {
  private store = inject(EnrollmentStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private studentApi = inject(StudentApi);

  form = this.fb.group({
    student: [null as string | null, [Validators.required]],
    section: [null as string | null, [Validators.required]],
    academicYear: [null as string | null, [Validators.required]],
    enrollmentType: ['new' as 'new' | 'returning' | 'transfer', [Validators.required]],
    status: ['enrolled' as 'enrolled' | 'completed' | 'dropped' | 'graduated', [Validators.required]],
    enrollmentDate: [new Date().toISOString().slice(0, 10)],
    observations: [''],
  });

  current: Enrollment | null = null;
  studentOptions: SelectOption[] = [];

  typeOptions: SelectOption[] = [
    { value: 'new', label: 'Nuevo' },
    { value: 'returning', label: 'Reinscripción' },
    { value: 'transfer', label: 'Traslado' },
  ];

  statusOptions: SelectOption[] = [
    { value: 'enrolled', label: 'Matriculado' },
    { value: 'completed', label: 'Completado' },
    { value: 'dropped', label: 'Retirado' },
    { value: 'graduated', label: 'Egresado' },
  ];

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    if (this.current) {
      this.form.patchValue({
        student: this.current.student?.id ?? null,
        section: this.current.section?.id ?? null,
        academicYear: this.current.academicYear?.id ?? null,
        enrollmentType: this.current.enrollmentType ?? 'new',
        status: this.current.status ?? 'enrolled',
        enrollmentDate: this.current.enrollmentDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        observations: this.current.observations ?? '',
      });
    }

    this.studentApi.getAll({}).subscribe({
      next: (res) => {
        this.studentOptions = (res.data ?? []).map((s) => ({
          value: s.id,
          label: (s as { name?: string }).name ?? (`${(s as { firstName?: string }).firstName ?? ''} ${(s as { lastName?: string }).lastName ?? ''}`.trim() || s.id),
        }));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      student: v.student!,
      section: v.section!,
      academicYear: v.academicYear!,
      enrollmentType: v.enrollmentType!,
      status: v.status!,
      enrollmentDate: v.enrollmentDate ?? undefined,
      observations: v.observations || undefined,
    };
    if (this.current?.id) {
      this.store.update(this.current.id, payload);
    } else {
      this.store.create(payload);
    }
    this.ref.close();
  }

  close(): void {
    this.ref.close();
  }
}
