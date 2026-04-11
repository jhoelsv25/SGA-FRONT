import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOption, SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { GradeLevelSelect, SectionSelect } from '@/shared/widgets/selects';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { PaymentApi } from '../../services/payment-api';
import { PaymentGroup } from '../../types/payment-types';

@Component({
  selector: 'sga-payment-group-form',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
    GradeLevelSelect,
    SectionSelect,
  ],
  templateUrl: './payment-group-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentGroupForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PaymentApi);
  private readonly ref = inject(ZardDialogRef);
  private readonly data = inject(Z_MODAL_DATA, { optional: true }) as {
    group?: PaymentGroup;
  } | null;

  readonly today = new Date().toISOString().slice(0, 10);
  readonly current = this.data?.group ?? null;
  saving = false;
  readonly generatedReference = this.current?.internalReference ?? this.buildGeneratedReference();
  readonly targetOptions: SelectOption[] = [
    { value: 'manual', label: 'Manual' },
    { value: 'grade', label: 'Por grado' },
    { value: 'section', label: 'Por sección' },
  ];

  readonly form = this.fb.group({
    targetScope: [this.current?.targetScope ?? 'manual', [Validators.required]],
    gradeId: [this.current?.gradeId ?? ''],
    sectionId: [this.current?.sectionId ?? ''],
    title: [this.current?.title ?? '', [Validators.required]],
    amount: [this.current?.amount ?? 0, [Validators.required, Validators.min(0.01)]],
    dueDate: [this.current?.dueDate?.slice(0, 10) ?? this.today, [Validators.required]],
    lateFee: [this.current?.lateFee ?? 0],
    discountAmount: [this.current?.discountAmount ?? 0],
    observations: [this.current?.observations ?? ''],
  });

  constructor() {
    this.form.controls.targetScope.valueChanges.subscribe((scope) => {
      if (scope === 'grade') {
        this.form.controls.sectionId.setValue('');
      }
      if (scope === 'section') {
        this.form.controls.gradeId.setValue('');
      }
      if (scope === 'manual') {
        this.form.controls.gradeId.setValue('');
        this.form.controls.sectionId.setValue('');
      }
    });
  }

  submit() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const payload = {
      ...this.form.getRawValue(),
      internalReference: this.generatedReference,
    } as any;
    const request = this.current?.id
      ? this.api.updateGroup(this.current.id, payload)
      : this.api.createGroup(payload);

    request.subscribe({
      next: (res) => {
        this.saving = false;
        this.ref.close(res.data);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  close() {
    this.ref.close();
  }

  get isEditMode() {
    return !!this.current?.id;
  }

  get targetScope() {
    return this.form.controls.targetScope.value ?? 'manual';
  }

  private buildGeneratedReference() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `GC-${yy}${mm}${dd}-${random}`;
  }
}
