import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { DatePicker } from '@shared/ui/date-picker/date-picker';
import { PeriodStore } from '../../services/store/period.store';
import type { Period } from '../../types/period-types';

@Component({
  selector: 'sga-period-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input, DatePicker],
  templateUrl: './period-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodForm implements OnInit {
  private store = inject(PeriodStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Period | null = null;

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      startDate: [this.current?.startDate ?? null, [Validators.required]],
      endDate: [this.current?.endDate ?? null, [Validators.required]],
      order: [this.current?.order ?? 1, [Validators.min(0)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload = {
      name: v.name,
      startDate: typeof v.startDate === 'string' ? v.startDate : v.startDate?.toISOString?.()?.slice(0, 10) ?? '',
      endDate: typeof v.endDate === 'string' ? v.endDate : v.endDate?.toISOString?.()?.slice(0, 10) ?? '',
      order: v.order,
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

  close(): void {
    this.ref.close();
  }
}
