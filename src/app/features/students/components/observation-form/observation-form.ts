export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { ObservationApi } from '../../services/api/observation-api';
import { StudentObservation } from '../../types/observation-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { StudentSelect, TeacherSelect } from '@/shared/widgets/selects';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';


@Component({
  selector: 'sga-observation-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent, ZardInputDirective, StudentSelect, TeacherSelect],
  templateUrl: './observation-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private api = inject(ObservationApi);

  form = this.fb.group({
    student: [null as string | null, [Validators.required]],
    teacher: [null as string | null, [Validators.required]],
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    type: ['behavioral' as 'behavioral' | 'academic' | 'social', [Validators.required]],
    observation: ['', [Validators.required]],
    followUp: [''],
    referral: [''],
    isConfidential: [false],
  });

  current: StudentObservation | null = null;
  typeOptions: LocalSelectOption[] = [
    { value: 'behavioral', label: 'Conducta' },
    { value: 'academic', label: 'Académico' },
    { value: 'social', label: 'Social' }];

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    if (this.current) {
      const o = this.current;
      this.form.patchValue({
        student: (o.student as {  id?: string  })?.id ?? null,
        teacher: (o.teacher as {  id?: string  })?.id ?? null,
        date: o.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        type: o.type,
        observation: o.observation,
        followUp: o.followUp ?? '',
        referral: o.referral ?? '',
        isConfidential: o.isConfidential ?? false,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      student: v.student!,
      teacher: v.teacher!,
      date: v.date!,
      type: v.type!,
      observation: v.observation!,
      followUp: v.followUp ?? '',
      referral: v.referral ?? '',
      isConfidential: v.isConfidential ?? false,
    };
    if (this.current?.id) {
      this.api.update(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    } else {
      this.api.create(payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    }
  }

  close(): void {
    this.ref.close();
  }
}
