import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import type { Payment } from '../../types/payment-types';

@Component({
  selector: 'sga-payment-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './payment-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCardComponent {
  payment = input.required<Payment>();

  viewDetail = output<Payment>();
  edit = output<Payment>();
  delete = output<Payment>();

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      partial: 'Parcial',
      paid: 'Pagado',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };
    return map[this.payment().status] ?? this.payment().status;
  });

  readonly statusClass = computed(() => {
    const map: Record<string, string> = {
      pending: 'border-warning/30 bg-warning/10 text-warning-700 dark:text-warning',
      partial: 'border-primary/30 bg-primary/10 text-primary',
      paid: 'border-success/30 bg-success/10 text-success-700 dark:text-success',
      overdue: 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger',
      cancelled: 'border-base-300 bg-base-200 text-base-content/70',
    };
    return map[this.payment().status] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });

  readonly remainingAmount = computed(() => {
    const total = Number(this.payment().amount || 0);
    const paid = Number(this.payment().paidAmount || 0);
    return Math.max(total - paid, 0);
  });
}
