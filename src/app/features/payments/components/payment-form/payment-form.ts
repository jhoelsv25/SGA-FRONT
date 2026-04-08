import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UploadApi } from '@core/services/api/upload-api';
import { Toast } from '@core/services/toast';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOption, SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { StudentSelect } from '@/shared/widgets/selects';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { PaymentApi } from '../../services/payment-api';
import { Payment, PaymentCreate } from '../../types/payment-types';

@Component({
  selector: 'sga-payment-form',
  imports: [CommonModule, ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, StudentSelect, SelectOptionComponent],
  templateUrl: './payment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentForm implements OnInit {
  private api = inject(PaymentApi);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private uploadApi = inject(UploadApi);
  private toast = inject(Toast);

  form!: FormGroup;
  current: Payment | null = null;
  group: any = null;
  readonly today = new Date().toISOString().slice(0, 10);
  uploadingEvidence = false;
  saving = false;
  evidenceName = '';
  readonly methodOptions: SelectOption[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'bank_transfer', label: 'Transferencia' },
    { value: 'debit_card', label: 'Tarjeta débito' },
    { value: 'credit_card', label: 'Tarjeta crédito' },
    { value: 'mobile_payment', label: 'Pago móvil' },
  ];
  readonly statusOptions: SelectOption[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' },
    { value: 'paid', label: 'Pagado' },
    { value: 'overdue', label: 'Vencido' },
    { value: 'cancelled', label: 'Anulado' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.group = this.data?.group ?? null;
    this.evidenceName = this.current?.evidenceName ?? '';
    this.form = this.fb.group({
      studentId: [this.current?.studentId ?? '', [Validators.required]],
      paymentGroupId: [this.current?.paymentGroupId ?? this.group?.id ?? ''],
      concept: [this.current?.concept ?? this.group?.title ?? '', [Validators.required]],
      amount: [this.current?.amount ?? this.group?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      dueDate: [this.current?.dueDate?.slice(0, 10) ?? this.group?.dueDate?.slice?.(0, 10) ?? '', [Validators.required]],
      amountPaid: [this.current?.paidAmount ?? 0, [Validators.min(0)]],
      paymentDate: [this.current?.paidAt?.slice(0, 10) ?? this.today],
      paymentMethod: [this.current?.paymentMethod ?? 'cash', [Validators.required]],
      installmentNumber: [this.current?.installmentNumber ?? 1, [Validators.required, Validators.min(1)]],
      receiptNumber: [this.current?.receiptNumber ?? ''],
      payerName: [this.current?.payerName ?? ''],
      lateFee: [this.current?.lateFee ?? this.group?.lateFee ?? 0, [Validators.min(0)]],
      discountAmount: [this.current?.discountAmount ?? this.group?.discountAmount ?? 0, [Validators.min(0)]],
      internalReference: [this.current?.internalReference ?? this.group?.internalReference ?? ''],
      externalReference: [this.current?.externalReference ?? this.current?.reference ?? ''],
      observations: [this.current?.observations ?? this.group?.observations ?? ''],
      evidenceUrl: [this.current?.evidenceUrl ?? ''],
      evidenceName: [this.current?.evidenceName ?? ''],
      status: [this.current?.status ?? 'pending'],
    });
  }

  submit() {
    if (this.form.invalid || this.saving) return;
    const v = this.form.value as PaymentCreate;
    this.saving = true;
    if (this.current?.id) {
      this.api.update(this.current.id, v).subscribe({
        next: (res) => {
          this.saving = false;
          this.toast.success(res.message ?? 'Pago actualizado');
          this.ref.close(res.data);
        },
        error: (error) => {
          this.saving = false;
          this.toast.error('No se pudo actualizar el pago', { description: error?.message });
        },
      });
    } else {
      this.api.create(v).subscribe({
        next: (res) => {
          this.saving = false;
          this.toast.success(res.message ?? 'Pago registrado');
          this.ref.close(res.data);
        },
        error: (error) => {
          this.saving = false;
          this.toast.error('No se pudo registrar el pago', { description: error?.message });
        },
      });
    }
  }

  close() {
    this.ref.close();
  }

  get isEditMode() {
    return !!this.current?.id;
  }

  get amountPreview() {
    return Number(this.form?.get('amount')?.value || 0);
  }

  get dueDatePreview() {
    return this.form?.get('dueDate')?.value || '';
  }

  get netAmountPreview() {
    const amount = Number(this.form?.get('amount')?.value || 0);
    const lateFee = Number(this.form?.get('lateFee')?.value || 0);
    const discount = Number(this.form?.get('discountAmount')?.value || 0);
    return Math.max(amount + lateFee - discount, 0);
  }

  onEvidenceSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingEvidence = true;
    this.uploadApi.upload(file, { category: 'payments', preserveName: true }).subscribe({
      next: (response) => {
        this.form.patchValue({
          evidenceUrl: response.url,
          evidenceName: response.name,
        });
        this.evidenceName = response.name;
        this.uploadingEvidence = false;
        this.toast.success('Comprobante subido correctamente');
      },
      error: (error) => {
        this.uploadingEvidence = false;
        this.toast.error('No se pudo subir el comprobante', { description: error?.message });
      },
    });
  }
}
