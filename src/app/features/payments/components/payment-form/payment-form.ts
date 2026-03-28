import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentStore } from '../../services/store/payment.store';
import { Payment, PaymentCreate } from '../../types/payment-types';
import { StudentSelect } from '@/shared/widgets/selects';


@Component({
  selector: 'sga-payment-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, StudentSelect],
  templateUrl: './payment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentForm implements OnInit {
  private store = inject(PaymentStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Payment | null = null;

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      studentId: [this.current?.studentId ?? '', [Validators.required]],
      concept: [this.current?.concept ?? '', [Validators.required]],
      amount: [this.current?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      dueDate: [this.current?.dueDate?.slice(0, 10) ?? '', [Validators.required]],
      reference: [this.current?.reference ?? ''],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as PaymentCreate;
    if (this.current?.id) {
      this.store.update(this.current.id, v);
      this.ref.close();
    } else {
      this.store.create(v);
      this.ref.close();
    }
  }

  close() {
    this.ref.close();
  }
}
