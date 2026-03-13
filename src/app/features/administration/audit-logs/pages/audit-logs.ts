import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditStore } from '@features/administration/services/store/audit.store';
import { AuditLog } from '@features/administration/services/api/audit-api';
import { AuditLogItem } from '../components/audit-log-item/audit-log-item';
import { AuditLogsFilters } from '../components/audit-logs-filters/audit-logs-filters';
import { Button } from '@shared/directives';
import { EmptyState } from '@shared/widgets/ui/empty-state/empty-state';

@Component({
  selector: 'sga-audit-logs',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AuditLogItem, 
    AuditLogsFilters,
    Button, 
    EmptyState
  ],
  templateUrl: './audit-logs.html',
  styles: [`
    :host { display: block; }
    .sticky {
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuditLogsComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public store = inject(AuditStore);
  
  public searchTerm = signal('');
  public actionFilter = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      const search = params['search'] || '';
      const action = params['action'] || null;
      
      this.searchTerm.set(search);
      this.actionFilter.set(action);
      
      this.refresh();
    });
  }

  public filteredLogs = computed(() => {
    return this.store.logs() as AuditLog[];
  });


  refresh() {
    const params: Record<string, unknown> = { search: this.searchTerm() };
    if (this.actionFilter()) params['action'] = this.actionFilter();
    this.store.loadInitial(params);
  }

  loadMore() {
    const params: Record<string, unknown> = { search: this.searchTerm() };
    if (this.actionFilter()) params['action'] = this.actionFilter();
    this.store.loadMore(params);
  }

  updateSearch(value: string) {
    this.updateQueryParams({ search: value || null });
  }

  updateAction(value: string | null) {
    this.updateQueryParams({ action: value || null });
  }

  private updateQueryParams(params: Record<string, unknown>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  clearFilters() {
    this.updateQueryParams({ search: null, action: null });
  }
}
