import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { ListToolbar } from '@shared/widgets/ui/list-toolbar';
import { Select, SelectOption } from '@shared/adapters/ui/select/select';
import { Button } from '@shared/directives';
import { PaymentStore } from '../../services/store/payment.store';
import { Payment } from '../../types/payment-types';
import { PaymentForm } from '../../components/payment-form/payment-form';
import { UiFiltersService } from '@core/services/ui-filters.service';

@Component({
  selector: 'sga-payments',
  imports: [CommonModule, ListToolbar, Select, DataSource, Button],
  templateUrl: './payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentsPage {
  private dialog = inject(DialogModalService);
  private store = inject(PaymentStore);
  public readonly filters = inject(UiFiltersService);

  columns = computed(() => this.store.columns());
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
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.data().length,
  }));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));
  activeFiltersCount = computed(() => [this.filters.paymentSearch(), this.filters.paymentStatus()].filter(Boolean).length);

  statusOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' },
    { value: 'paid', label: 'Pagado' },
    { value: 'overdue', label: 'Vencido' },
    { value: 'cancelled', label: 'Cancelado' },
  ]);

  onSearch(value: string): void {
    this.filters.setPaymentSearch(value);
  }

  onStatusChange(value: unknown): void {
    this.filters.setPaymentStatus(String(value ?? ''));
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Payment;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
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

  private openForm(current?: Payment | null) {
    this.dialog.open(PaymentForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }
}
