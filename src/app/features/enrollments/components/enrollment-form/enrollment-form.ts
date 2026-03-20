import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { EnrollmentStore } from '../../services/store/enrollment.store';
import { StudentApi } from '@features/students/services/api/student-api';
import { Enrollment } from '../../types/enrollment-types';

export type LocalSelectOption = { value: string | number | boolean; label: string; [key: string]: any };

@Component({
  selector: 'sga-enrollment-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent, ZardInputDirective],
  templateUrl: './enrollment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentForm implements OnInit {
  private store = inject(EnrollmentStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
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
  studentOptions: LocalSelectOption[] = [];
  studentPage = 1;
  readonly studentPageSize = 30;
  studentHasMore = true;
  studentLoadingMore = false;

  typeOptions: LocalSelectOption[] = [
    { value: 'new', label: 'Nuevo' },
    { value: 'returning', label: 'Reinscripción' },
    { value: 'transfer', label: 'Traslado' }];

  statusOptions: LocalSelectOption[] = [
    { value: 'enrolled', label: 'Matriculado' },
    { value: 'completed', label: 'Completado' },
    { value: 'dropped', label: 'Retirado' },
    { value: 'graduated', label: 'Egresado' }];

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

    this.loadStudents();
  }

  loadStudents(): void {
    if (!this.studentHasMore || this.studentLoadingMore) return;
    this.studentLoadingMore = true;
    this.studentApi.getAll({ page: this.studentPage, size: this.studentPageSize }).subscribe({
      next: (res) => {
        const newOptions = (res.data ?? []).map((s) => ({
          value: s.id,
          label:
            (s as { name?: string }).name ||
            `${(s as { firstName?: string }).firstName ?? ''} ${(s as { lastName?: string }).lastName ?? ''}`.trim() ||
            s.studentCode ||
            s.id,
        }));
        this.studentOptions = [...this.studentOptions, ...newOptions];
        const loaded = this.studentOptions.length;
        const total = res.total ?? loaded;
        this.studentHasMore = loaded < total;
        this.studentPage += 1;
        this.studentLoadingMore = false;
      },
      error: () => {
        this.studentLoadingMore = false;
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
