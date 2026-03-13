import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/adapters/ui/input/input';
import { DatePicker } from '@shared/widgets/ui/date-picker/date-picker';
import { Select } from '@shared/adapters/ui/select/select';
import { PeriodStore } from '../../services/store/period.store';
import { PeriodStatus } from '../../types/period-types';
import type { Period } from '../../types/period-types';

const STATUS_OPTIONS = [
  { value: PeriodStatus.PLANNED, label: 'Planificado' },
  { value: PeriodStatus.IN_PROGRESS, label: 'En curso' },
  { value: PeriodStatus.COMPLETED, label: 'Completado' },
  { value: PeriodStatus.CANCELLED, label: 'Cancelado' },
];

@Component({
  selector: 'sga-period-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input, DatePicker, Select],
  templateUrl: './period-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodForm implements OnInit {
  private store = inject(PeriodStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Period | null = null;
  yearAcademicId: string | null = null;
  yearAcademicName: string | null = null;
  readonly statusOptions = STATUS_OPTIONS;

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    this.yearAcademicId = this.data?.yearAcademicId ?? null;
    this.yearAcademicName = this.data?.yearAcademicName ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      startDate: [this.current?.startDate ?? null, [Validators.required]],
      endDate: [this.current?.endDate ?? null, [Validators.required]],
      ...(this.current && { status: [this.current?.status ?? PeriodStatus.PLANNED, [Validators.required]] }),
    });
  }

  /** Formatea a YYYY-MM-DD para el backend (ISO 8601 date). */
  private toDateString(d: Date | string | null | undefined): string {
    if (d == null) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: Record<string, unknown> = {
      name: v.name,
      startDate: this.toDateString(v.startDate),
      endDate: this.toDateString(v.endDate),
    };
    if (v.status != null) payload['status'] = v.status;
    if (this.current?.id) {
      this.store.update(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
      });
    } else {
      if (this.yearAcademicId) {
        payload['academicYearId'] = this.yearAcademicId;
      }
      this.store.create(payload).subscribe({
        next: () => this.ref.close(),
      });
    }
  }

  close(): void {
    this.ref.close();
  }
}
