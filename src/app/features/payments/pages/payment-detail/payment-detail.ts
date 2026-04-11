import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { PaymentApi } from '../../services/payment-api';
import type { Payment } from '../../types/payment-types';
import { PaymentForm } from '../../components/payment-form/payment-form';

@Component({
  selector: 'sga-payment-detail',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
  ],
  templateUrl: './payment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentApi = inject(PaymentApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly payment = signal<Payment | null>(
    (history.state?.payment as Payment | undefined) ?? null,
  );
  readonly loading = signal(true);

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      partial: 'Parcial',
      paid: 'Pagado',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };
    return map[this.payment()?.status ?? ''] ?? (this.payment()?.status || 'Sin estado');
  });

  readonly remainingAmount = computed(() => {
    const payment = this.payment();
    if (!payment) return 0;
    return Math.max(Number(payment.amount || 0) - Number(payment.paidAmount || 0), 0);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/payments/register']);
      return;
    }
    this.loadPayment(id);
  }

  goBack(): void {
    this.router.navigate(['/payments/register']);
  }

  openEdit(): void {
    const current = this.payment();
    if (!current) return;
    this.dialog
      .open(PaymentForm, {
        data: { current },
        width: '720px',
        maxHeight: '88vh',
      })
      .closed.subscribe(() => this.reload());
  }

  goToStudent(): void {
    const studentId = this.payment()?.studentId;
    if (!studentId) return;
    this.router.navigate(['/students', studentId]);
  }

  deleteCurrent(): void {
    const current = this.payment();
    if (!current) return;
    this.paymentApi.delete(current.id).subscribe({
      next: () => {
        this.toast.success('Pago eliminado');
        this.router.navigate(['/payments/register']);
      },
      error: (error) => {
        this.toast.error('No se pudo eliminar el pago', { description: error?.message });
      },
    });
  }

  private reload(): void {
    const id = this.payment()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadPayment(id);
  }

  private loadPayment(id: string): void {
    this.loading.set(true);
    this.paymentApi.getById(id).subscribe({
      next: (res) => {
        this.payment.set(res.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el pago', { description: error?.message });
        this.router.navigate(['/payments/register']);
      },
    });
  }
}
