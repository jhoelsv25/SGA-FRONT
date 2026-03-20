import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentStore } from '../../services/store/payment.store';
import { Payment } from '../../types/payment-types';
import { PaymentForm } from '../../components/payment-form/payment-form';
import { UiFiltersService } from '@core/services/ui-filters.service';
import { PaymentCardComponent } from '../../components/payment-card/payment-card';
import { Router } from '@angular/router';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';


@Component({
  selector: 'sga-payments',
  imports: [CommonModule, SelectOptionComponent, ZardButtonComponent, ListToolbarComponent, PaymentCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentsPage {
  private dialog = inject(DialogModalService);
  private store = inject(PaymentStore);
  private router = inject(Router);
  public readonly filters = inject(UiFiltersService);

  data = computed(() => {
    const search = this.filters.paymentSearch().toLowerCase();
    const status = this.filters.paymentStatus();

    return this.store.data().filter((row) => {
      const matchesSearch =
        !search ||
        row.studentName?.toLowerCase().includes(search) ||
        row.concept?.toLowerCase().includes(search) ||
        row.reference?.toLowerCase().includes(search);
      const matchesStatus = !status || row.status === status;
      return matchesSearch && matchesStatus;
    });
  });
  loading = computed(() => this.store.loading());
  activeFiltersCount = computed(() => [this.filters.paymentSearch(), this.filters.paymentStatus()].filter(Boolean).length);
  pendingCount = computed(() => this.data().filter((item) => item.status === 'pending').length);
  paidCount = computed(() => this.data().filter((item) => item.status === 'paid').length);
  overdueCount = computed(() => this.data().filter((item) => item.status === 'overdue').length);
  totalAmount = computed(() => this.data().reduce((sum, item) => sum + Number(item.amount || 0), 0));

  statusOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' },
    { value: 'paid', label: 'Pagado' },
    { value: 'overdue', label: 'Vencido' },
    { value: 'cancelled', label: 'Cancelado' }]);

  onSearch(value: string): void {
    this.filters.setPaymentSearch(value);
  }

  onStatusChange(value: unknown): void {
    this.filters.setPaymentStatus(String(value ?? ''));
  }

  onRefresh(): void {
    this.store.loadAll();
  }

  clearFilters(): void {
    this.filters.clearPaymentFilters();
  }

  openCreate(): void {
    this.openForm();
  }

  viewDetail(payment: Payment): void {
    this.router.navigate(['/payments', payment.id], {
      state: { payment },
    });
  }

  editPayment(payment: Payment): void {
    this.openForm(payment);
  }

  deletePayment(payment: Payment): void {
    this.store.delete(payment.id);
  }

  private openForm(current?: Payment | null) {
    this.dialog.open(PaymentForm, {
      data: { current: current ?? null },
      width: '480px',
      maxHeight: '80vh',
    });
  }
}
