import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PermissionCheckStore } from '@core/stores/permission-check.store';
import {
  DataSourceColumn,
  DataSourceConfig,
  DataSourceSorting,
} from '@core/types/data-source-types';
import { ActionConfig, ActionContext } from '@core/types/action-types';

import { CellFormatter } from '@core/services/cell-formated';

import { Button } from '@shared/directives';
import { Checkbox } from '@shared/ui/checkbox/checkbox';
import { Pagination } from '@shared/ui/pagination/pagination';
import { Search } from '@shared/ui/search/search';

import {
  getActionMenuItemClasses,
  getColumnClasses,
  getRowClasses,
} from '@shared/utils/data-source';

@Component({
  selector: 'sga-data-source',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination, Checkbox, Button, Search],
  templateUrl: './data-source.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSource implements OnInit, OnDestroy {
  private permissionStore = inject(PermissionCheckStore);
  private formatter = inject(CellFormatter);

  private clickListener: (() => void) | null = null;

  // =========================
  // INPUTS
  // =========================
  data = input<unknown[]>([]);
  columns = input<DataSourceColumn[]>([]);
  actions = input<ActionConfig[]>([]);
  massActions = input<ActionConfig[]>([]);
  config = input<DataSourceConfig>({
    localSort: true,
    selectable: true,
    multiSelect: true,
    sortable: true,
    pagination: true,
  });
  loading = input(false);
  selectedItems = input<unknown[]>([]);
  currentSort = input<DataSourceSorting | null>(null);
  pagination = input<{ page: number; size: number; total: number } | undefined>();
  searchTerm = input('');

  // =========================
  // OUTPUTS
  // =========================
  selectionChange = output<unknown[]>();
  actionClick = output<{ action: ActionConfig; context: ActionContext }>();
  massActionClick = output<{ action: ActionConfig; context: ActionContext }>();
  rowClick = output<{ row: unknown }>();
  sortChange = output<DataSourceSorting>();
  rowOrderChange = output<{ from: number; to: number }>();
  searchOutput = output<string>();

  // =========================
  // STATE
  // =========================
  selectedRows = signal<Set<unknown>>(new Set());
  openMenuId = signal<string | null>(null);
  dragIndex = signal(-1);
  localSearch = signal('');

  // =========================
  // COMPUTED – ACTIONS
  // =========================
  filteredActions = computed(() => this.permissionStore.filterActions(this.actions()));

  filteredMassActions = computed(() => this.permissionStore.filterActions(this.massActions()));

  hasActions = computed(() => this.filteredActions().length > 0);
  hasSelection = computed(() => this.selectedRows().size > 0);

  // =========================
  // DATA
  // =========================
  displayData = computed(() => {
    const term = this.localSearch().trim().toLowerCase();
    if (!term) return this.data();

    return this.data().filter((row) =>
      this.columns().some((col) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (row as any)[col.key];
        return val != null && String(val).toLowerCase().includes(term);
      }),
    );
  });

  sortedData = computed(() => {
    const sort = this.currentSort();
    if (!this.config().localSort || !sort) return this.displayData();
    return this.sortData(this.displayData(), sort);
  });

  totalCount = computed(() => this.pagination()?.total ?? this.data().length);

  // =========================
  // LIFECYCLE
  // =========================
  ngOnInit(): void {
    if (this.selectedItems().length) {
      this.selectedRows.set(new Set(this.selectedItems()));
    }

    this.clickListener = () => this.closeMenu();
    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  // =========================
  // SELECTION
  // =========================
  toggleRow(row: unknown): void {
    const selected = new Set(this.selectedRows());

    if (this.config().multiSelect) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      selected.has(row) ? selected.delete(row) : selected.add(row);
    } else {
      selected.clear();
      selected.add(row);
    }

    this.selectedRows.set(selected);
    this.selectionChange.emit([...selected]);
  }

  toggleAll(): void {
    if (!this.config().multiSelect) return;

    const selected = this.allSelected() ? new Set<unknown>() : new Set(this.displayData());

    this.selectedRows.set(selected);
    this.selectionChange.emit([...selected]);
  }

  allSelected(): boolean {
    const data = this.displayData();
    return data.length > 0 && data.every((r) => this.selectedRows().has(r));
  }

  partialSelected(): boolean {
    const data = this.displayData();
    const count = data.filter((r) => this.selectedRows().has(r)).length;
    return count > 0 && count < data.length;
  }

  isSelected(row: unknown): boolean {
    return this.selectedRows().has(row);
  }

  // =========================
  // SORTING
  // =========================
  sortColumn(col: DataSourceColumn): void {
    if (!col.sortable || !this.config().sortable) return;

    const current = this.currentSort();
    const direction = current?.column === col.key && current.direction === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({ column: col.key, direction });
  }

  getSortIcon(col: DataSourceColumn): string {
    const sort = this.currentSort();
    if (!sort || sort.column !== col.key) return 'fas fa-sort';
    return sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // =========================
  // ACTIONS
  // =========================
  executeAction(action: ActionConfig, row: unknown): void {
    if (this.isDisabled(action, row)) return;

    this.actionClick.emit({
      action,
      context: {
        row,
        selected: [...this.selectedRows()],
      },
    });

    this.closeMenu();
  }

  executeMassAction(action: ActionConfig): void {
    this.massActionClick.emit({
      action,
      context: {
        selected: [...this.selectedRows()],
      },
    });
  }

  onMassDelete(): void {
    this.executeMassAction({
      key: 'delete',
      label: 'Eliminar',
      color: 'danger',
      typeAction: 'massive',
    } as ActionConfig);
  }

  isDisabled(action: ActionConfig, row?: unknown): boolean {
    const ctx: ActionContext = {
      row,
      selected: [...this.selectedRows()],
    };
    return typeof action.disabled === 'function' ? action.disabled(ctx) : !!action.disabled;
  }

  isVisible(action: ActionConfig, row?: unknown): boolean {
    const ctx: ActionContext = {
      row,
      selected: [...this.selectedRows()],
    };
    return typeof action.visible === 'function' ? action.visible(ctx) : action.visible !== false;
  }

  // =========================
  // MENU
  // =========================
  toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  isMenuOpen(id: string): boolean {
    return this.openMenuId() === id;
  }

  getRowId(row: unknown, index: number): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (row as any)?.id?.toString() ?? index.toString();
  }

  // =========================
  // SEARCH
  // =========================
  onLocalSearch(term: string): void {
    this.localSearch.set(term);
    this.searchOutput.emit(term);
  }

  // =========================
  // CELL HELPERS
  // =========================
  formatCell(row: unknown, col: DataSourceColumn): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.formatter.format((row as any)[col.key], col);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  getRowClasses(row: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return getRowClasses(row, 0, this.config(), this.isSelected(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getColumnClasses(col: DataSourceColumn): string {
    return getColumnClasses(col, this.config());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getActionClasses(action: ActionConfig): string {
    return getActionMenuItemClasses(action);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRowProperty(row: unknown, key: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (row as any)?.[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRowPropertyAsArray(row: unknown, key: string): unknown[] {
    const val = this.getRowProperty(row, key);
    return Array.isArray(val) ? val : [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getArrayLength(val: unknown): number {
    return Array.isArray(val) ? val.length : 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getVisibleItems(arr: unknown[], max?: number): unknown[] {
    return max ? arr.slice(0, max) : arr;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getNestedProperty(obj: unknown, key: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (obj as any)?.[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isArray(val: unknown): boolean {
    return Array.isArray(val);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isRowPropertyTruthy(row: unknown, key: string): boolean {
    return !!this.getRowProperty(row, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getArrayDisplay(item: unknown, col: any): string {
    return typeof item === 'object'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((item as any)[col.arrayLabelKey ?? 'label'] ?? JSON.stringify(item))
      : String(item);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValueColor(col: any, item: unknown): string {
    return col.valueColor?.(item) ?? '';
  }

  // =========================
  // PAGINATION
  // =========================
  getPage(): number {
    return this.pagination()?.page ?? 1;
  }

  getSize(): number {
    return this.pagination()?.size ?? 10;
  }

  // =========================
  // SORT HELPER
  // =========================
  private sortData(data: unknown[], sort: DataSourceSorting): unknown[] {
    const col = this.columns().find((c) => c.key === sort.column);
    if (!col) return data;

    const dir = sort.direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal = (a as any)[col.key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal = (b as any)[col.key];
      if (aVal == null) return dir;
      if (bVal == null) return -dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }

  // Handler para sga-checkbox en columnas booleanas
  onBooleanToggle(checked: boolean, col: DataSourceColumn, row: unknown): void {
    // Usa onToggle si está definido, como indica el tipo DataSourceColumn
    if (typeof col.onToggle === 'function') {
      col.onToggle(checked, row);
    } else {
      // Si no, intenta actualizar el valor directamente
      if (row && col.key) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row as any)[col.key] = checked;
      }
    }
  }

  // Devuelve las clases CSS para una celda
  getCellClasses(col: DataSourceColumn, row: unknown): string {
    if (typeof col.cellCssClass === 'function') {
      return col.cellCssClass(this.getRowProperty(row, col.key), row);
    }
    return col.cellCssClass || '';
  }

  // Determina si una columna es visible para una fila
  isColumnVisible(col: DataSourceColumn, row?: unknown): boolean {
    if (typeof col.visible === 'function') {
      return col.visible(row);
    }
    return col.visible !== false;
  }
}
