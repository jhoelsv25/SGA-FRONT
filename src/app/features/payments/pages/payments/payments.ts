import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@auth/services/store/auth.store';
import { UiFiltersService } from '@core/services/ui-filters.service';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { SelectOption, SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { PaymentApi } from '../../services/payment-api';
import { PaymentGroup } from '../../types/payment-types';
import { PaymentGroupForm } from '../../components/payment-group-form/payment-group-form';

@Component({
  selector: 'sga-payments',
  imports: [CommonModule, SelectOptionComponent, ZardButtonComponent, ListToolbarComponent, ZardEmptyComponent, ZardSkeletonComponent, ZardPopoverDirective, ZardPopoverComponent],
  templateUrl: './payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentsPage {
  private dialog = inject(DialogModalService);
  private api = inject(PaymentApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);
  public readonly filters = inject(UiFiltersService);

  readonly loading = signal(false);
  readonly groups = signal<PaymentGroup[]>([]);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.filters.setPaymentSearch(params.get('search') ?? '');
      this.filters.setPaymentStatus(params.get('status') ?? '');
      this.loadGroups();
    });
  }

  roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');
  pageTitle = computed(() => {
    const routePath = this.route.routeConfig?.path;
    if (routePath === 'pending') return 'Pagos Pendientes';
    if (routePath === 'history') return 'Historial de Pagos';
    return 'Grupos de Cobro';
  });
  pageDescription = computed(() => {
    const routePath = this.route.routeConfig?.path;
    if (routePath === 'pending') return 'Monitorea grupos con cobros pendientes, mora o abonos parciales.';
    if (routePath === 'history') return 'Revisa grupos ya regularizados.';
    return 'Crea cabeceras de cobro y luego registra pagos individuales dentro de cada grupo.';
  });
  searchPlaceholder = computed(() => 'Buscar por concepto, referencia o descripción...');
  createLabel = computed(() => 'Crear grupo de cobro');

  data = computed(() => {
    const search = this.filters.paymentSearch().toLowerCase();
    const status = this.filters.paymentStatus();
    return this.groups().filter((group) => {
      const matchesSearch =
        !search ||
        group.title?.toLowerCase().includes(search) ||
        group.internalReference?.toLowerCase().includes(search) ||
        group.observations?.toLowerCase().includes(search);
      const matchesStatus = !status || group.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  activeFiltersCount = computed(() => [this.filters.paymentSearch(), this.filters.paymentStatus()].filter(Boolean).length);
  pendingCount = computed(() => this.data().filter((item) => item.status === 'pending').length);
  paidCount = computed(() => this.data().filter((item) => item.status === 'paid').length);
  overdueCount = computed(() => this.data().filter((item) => item.status === 'overdue').length);
  totalAmount = computed(() => this.data().reduce((sum, item) => sum + Number(item.totalAmount || 0), 0));
  outstandingAmount = computed(() => this.data().reduce((sum, item) => sum + Number(item.outstandingAmount || 0), 0));
  collectionFocus = computed(() => {
    if (this.overdueCount() > 0) return 'Hay grupos con mora que requieren seguimiento inmediato.';
    if (this.pendingCount() > 0) return 'Tienes grupos creados esperando registro de pagos.';
    if (this.data().length > 0) return 'Los grupos visibles están estables.';
    return 'Todavía no hay grupos de cobro creados.';
  });
  priorityGroups = computed(() => [...this.data()].sort((a, b) => Number(b.outstandingAmount || 0) - Number(a.outstandingAmount || 0)).slice(0, 3));

  statusOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' },
    { value: 'paid', label: 'Pagado' },
    { value: 'overdue', label: 'Vencido' },
  ]);

  onSearch(value: string): void {
    this.filters.setPaymentSearch(value);
    this.syncUrl();
  }

  onStatusChange(value: unknown): void {
    this.filters.setPaymentStatus(String(value ?? ''));
    this.syncUrl();
  }

  onRefresh(): void {
    this.loadGroups();
  }

  clearFilters(): void {
    this.filters.clearPaymentFilters();
    this.syncUrl();
  }

  openCreate(): void {
    this.dialog.open(PaymentGroupForm, {
      width: '680px',
      maxHeight: '88vh',
    }).closed.subscribe((result?: any) => {
      if (result?.id) {
        this.openGroupDetail(result.id);
      } else {
        this.loadGroups();
      }
    });
  }

  openGroupDetail(groupId: string): void {
    const routePath = this.route.routeConfig?.path ?? 'register';
    this.router.navigate(['/payments/group', groupId], {
      queryParams: { mode: routePath },
    });
  }

  openPriorityGroup(group: PaymentGroup): void {
    this.openGroupDetail(group.id);
  }

  statusLabel(status: PaymentGroup['status']): string {
    if (status === 'overdue') return 'Con mora';
    if (status === 'pending') return 'Pendiente';
    if (status === 'partial') return 'Parcial';
    return 'Regularizado';
  }

  private loadGroups() {
    this.loading.set(true);
    const routePath = this.route.routeConfig?.path;
    const params: any = {};
    if (routePath === 'pending') params.mode = 'pending';
    if (routePath === 'history') params.mode = 'history';
    if (this.filters.paymentSearch()) params.search = this.filters.paymentSearch();
    if (this.filters.paymentStatus()) params.status = this.filters.paymentStatus();

    this.api.getGroups(params).subscribe({
      next: (res) => {
        this.groups.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.groups.set([]);
        this.loading.set(false);
      },
    });
  }

  private syncUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.filters.paymentSearch() || null,
        status: this.filters.paymentStatus() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
