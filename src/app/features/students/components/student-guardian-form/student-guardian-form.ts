export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { GuardianApi } from '@/features/students/services/api/guardian-api';
import { StudentApi } from '@/features/students/services/api/student-api';
import { StudentGuardian } from '@/features/students/types/guardian-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';


@Component({
  selector: 'sga-student-guardian-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent],
  templateUrl: './student-guardian-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGuardianForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private api = inject(GuardianApi);
  private studentApi = inject(StudentApi);

  form = this.fb.group({
    student: [null as string | null, [Validators.required]],
    guardian: [null as string | null, [Validators.required]],
    isPrimary: [false, [Validators.required]],
    pickupAuthorization: [false, [Validators.required]],
    emergencyContact: [false, [Validators.required]],
    receivesNotifications: [''],
  });

  current: StudentGuardian | null = null;
  studentOptions: LocalSelectOption[] = [];
  guardianOptions: LocalSelectOption[] = [];
  studentPage = 1;
  readonly studentPageSize = 30;
  studentHasMore = true;
  studentLoadingMore = false;

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    if (this.current) {
      const sg = this.current;
      this.form.patchValue({
        student: (sg.student as {  id?: string  })?.id ?? null,
        guardian: (sg.guardian as {  id?: string  })?.id ?? null,
        isPrimary: sg.isPrimary,
        pickupAuthorization: sg.pickupAuthorization,
        emergencyContact: sg.emergencyContact,
        receivesNotifications: sg.receivesNotifications ?? '',
      });
    }

    this.loadStudents();

    this.api.getAll({}).subscribe({
      next: (res) => {
        this.guardianOptions = (res.data ?? []).map((g) => {
          const person = (g as {  person?: { firstName?: string; lastName?: string  } }).person;
          const namePart = person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() : '';
          const occ = (g as {  occupation?: string  }).occupation;
          const label = namePart || occ || g.id;
          return { value: g.id, label };
        });
      },
    });
  }

  loadStudents(): void {
    if (!this.studentHasMore || this.studentLoadingMore) return;
    this.studentLoadingMore = true;
    this.studentApi.getAll({ page: this.studentPage, size: this.studentPageSize }).subscribe({
      next: (res) => {
        const newOptions = (res.data ?? []).map((s) => {
          const p = (s as { person?: { firstName?: string; lastName?: string } }).person;
          const label =
            (s as { name?: string }).name ??
            (p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : null) ??
            (s as { studentCode?: string }).studentCode ??
            s.id;
          return { value: s.id, label: label || s.id };
        });
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
      guardian: v.guardian!,
      isPrimary: v.isPrimary!,
      pickupAuthorization: v.pickupAuthorization!,
      emergencyContact: v.emergencyContact!,
      receivesNotifications: v.receivesNotifications || undefined,
    };
    if (this.current?.id) {
      this.api.updateStudentGuardian(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    } else {
      this.api.createStudentGuardian(payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    }
  }

  close(): void {
    this.ref.close();
  }
}
