export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { GuardianApi } from '@/features/students/services/api/guardian-api';
import { StudentGuardian } from '@/features/students/types/guardian-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { GuardianSelect, StudentSelect } from '@/shared/widgets/selects';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';


@Component({
  selector: 'sga-student-guardian-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCheckboxComponent, StudentSelect, GuardianSelect],
  templateUrl: './student-guardian-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGuardianForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private api = inject(GuardianApi);

  form = this.fb.group({
    student: [null as string | null, [Validators.required]],
    guardian: [null as string | null, [Validators.required]],
    isPrimary: [false, [Validators.required]],
    pickupAuthorization: [false, [Validators.required]],
    emergencyContact: [false, [Validators.required]],
    receivesNotifications: [''],
  });

  current: StudentGuardian | null = null;
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
