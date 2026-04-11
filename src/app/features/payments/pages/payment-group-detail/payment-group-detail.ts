import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { PaymentCardComponent } from '../../components/payment-card/payment-card';
import { PaymentForm } from '../../components/payment-form/payment-form';
import { PaymentGroupForm } from '../../components/payment-group-form/payment-group-form';
import { PaymentApi } from '../../services/payment-api';
import { PaymentGroup } from '../../types/payment-types';

@Component({
  selector: 'sga-payment-group-detail',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    PaymentCardComponent,
  ],
  templateUrl: './payment-group-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentGroupDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PaymentApi);
  private readonly dialog = inject(DialogModalService);

  readonly loading = signal(false);
  readonly group = signal<PaymentGroup | null>(null);
  readonly mode = computed(() => this.route.snapshot.queryParamMap.get('mode') || 'register');

  constructor() {
    this.loadGroup();
  }

  goBack() {
    const mode = this.mode();
    const path =
      mode === 'pending'
        ? '/payments/pending'
        : mode === 'history'
          ? '/payments/history'
          : '/payments/register';
    this.router.navigate([path]);
  }

  openPayment(paymentId: string) {
    this.router.navigate(['/payments', paymentId]);
  }

  openRegisterPayment() {
    const current = this.group();
    if (!current) return;
    this.dialog
      .open(PaymentForm, {
        data: {
          current: null,
          group: current,
        },
        width: '720px',
        maxHeight: '88vh',
      })
      .closed.subscribe(() => this.loadGroup());
  }

  openEditGroup() {
    const current = this.group();
    if (!current) return;
    this.dialog
      .open(PaymentGroupForm, {
        data: { group: current },
        width: '680px',
        maxHeight: '88vh',
      })
      .closed.subscribe((result: unknown) => {
        const updated = result as PaymentGroup | undefined;
        if (updated?.id) {
          this.group.set(updated);
        } else {
          this.loadGroup();
        }
      });
  }

  statusLabel(status: PaymentGroup['status']) {
    if (status === 'overdue') return 'Con mora';
    if (status === 'pending') return 'Pendiente';
    if (status === 'partial') return 'Parcial';
    return 'Regularizado';
  }

  private loadGroup() {
    const id = this.route.snapshot.paramMap.get('groupKey');
    if (!id) return;
    this.loading.set(true);
    this.api.getGroupById(id).subscribe({
      next: (res) => {
        this.group.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.group.set(null);
        this.loading.set(false);
      },
    });
  }
}
