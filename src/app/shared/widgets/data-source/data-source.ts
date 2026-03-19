import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardPaginationComponent } from '@/shared/components/pagination';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit, OnDestroy, ContentChildren, QueryList, TemplateRef, Directive } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PermissionCheckStore } from '@core/stores/permission-check.store';
import {
  DataSourceColumn,
  DataSourceConfig,
  DataSourceSorting,
} from '@core/types/data-source-types';
import { ActionConfig, ActionContext } from '@core/types/action-types';

import { CellFormatter } from '@core/services/cell-formated';
import { CursorPagination } from '@core/types/pagination-types';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { DropdownItem, DropdownOptionComponent } from '@/shared/widgets/dropdown-option/dropdown-option';

import { getActionMenuItemClasses, getColumnClasses, getRowClasses } from '@/shared/utils/data-source';

@Directive({
  selector: '[sgaTemplate]',
  standalone: true,
})
export class SgaTemplate {
  name = input.required<string>({ alias: 'sgaTemplate' });
  public templateRef = inject(TemplateRef<unknown>);
}


@Component({
  selector: 'sga-data-source',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardPaginationComponent, ZardCheckboxComponent, ZardButtonComponent, ZardEmptyComponent, ZardInputDirective, DropdownOptionComponent],
  templateUrl: './data-source.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSource implements OnInit, OnDestroy {
  Math = Math;
  @ContentChildren(SgaTemplate) templates!: QueryList<SgaTemplate>;

  getTemplate(name: string | undefined): TemplateRef<unknown> | null {
    if (!name || !this.templates) return null;
    return this.templates.find((t) => t.name() === name)?.templateRef || null;
  }

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
  pagination = input<
    | { page: number; size: number; total: number }
    | { nextCursor?: string | null; hasNext: boolean; limit: number; loadedCount: number }
    | undefined
  >();
  searchTerm = input('');
  showToolbar = input(true);
  emptyStateTitle = input('Sin datos disponibles');
  emptyStateDescription = input('No se encontraron registros para mostrar en esta tabla.');
  emptyStateIcon = input('fas fa-folder-open');

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
  pageChange = output<{ page: number; size: number }>();
  loadMore = output<string>();

  // =========================
  // STATE
  // =========================
  selectedRows = signal<Set<unknown>>(new Set());
  openMenuId = signal<string | null>(null);
  dragIndex = signal(-1);
  localSearch = signal('');
  /** Celda en edición inline: { rowId, colKey } */
  editingCell = signal<{ rowId: string; colKey: string } | null>(null);
  editValue = signal<string>('');

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
        const val = (row as Record<string, unknown>)[col.key];
        return val != null && String(val).toLowerCase().includes(term);
      }),
    );
  });

  sortedData = computed(() => {
    const sort = this.currentSort();
    if (!this.config().localSort || !sort) return this.displayData();
    return this.sortData(this.displayData(), sort);
  });

  /** Filas a mostrar: con paginación offset se corta por página; con búsqueda activa el total es el filtrado. */
  paginatedData = computed(() => {
    const list = this.sortedData();
    const p = this.pagination();
    if (!p || 'hasNext' in p) return list;
    const page = p.page ?? 1;
    const size = p.size ?? 10;
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  totalCount = computed(() => {
    const p = this.pagination();
    if (!p) return this.data().length;
    if (this.localSearch().trim()) return this.sortedData().length;
    return 'total' in p ? p.total : (p as CursorPagination).loadedCount;
  });

  isCursorPagination = computed(() => {
    const p = this.pagination();
    return p != null && 'hasNext' in p && 'nextCursor' in p;
  });

  cursorPagination = computed(() => this.pagination() as CursorPagination | undefined);

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
    return (row as Record<string, unknown>)?.['id']?.toString() ?? index.toString();
  }

  getRowDropdownItems(row: unknown): DropdownItem[] {
    return this.filteredActions()
      .filter((action) => this.isVisible(action, row))
      .map((action) => ({
        label: this.getActionLabel(action, row),
        icon: action.icon,
        disabled: this.isDisabled(action, row),
        action: () => this.executeAction(action, row),
      }));
  }

  getActionLabel(action: ActionConfig, row?: unknown): string {
    if (action.key === 'toggle-active' && row) {
      return this.isRowPropertyTruthy(row, 'isActive') ? 'Desactivar' : 'Activar';
    }
    return action.label;
  }

  // =========================
  // SEARCH
  // =========================
  onLocalSearch(term: string): void {
    this.localSearch.set(term);
    this.searchOutput.emit(term);
  }

  onPaginationChange(page: number): void {
    this.pageChange.emit({ page, size: this.getSize() });
  }

  // =========================
  // INLINE EDIT (text/number)
  // =========================
  isCellEditing(row: unknown, col: DataSourceColumn, index: number): boolean {
    const ec = this.editingCell();
    if (!ec) return false;
    return ec.rowId === this.getRowId(row, index) && ec.colKey === col.key;
  }

  startCellEdit(row: unknown, col: DataSourceColumn, index: number): void {
    if (!col.onSave) return;
    this.editingCell.set({ rowId: this.getRowId(row, index), colKey: col.key });
    const val = this.getRowProperty(row, col.key);
    this.editValue.set(val != null ? String(val) : '');
  }

  setCellEditValue(value: string): void {
    this.editValue.set(value);
  }

  saveCellEdit(row: unknown, col: DataSourceColumn): void {
    const val = this.editValue();
    const colDef = this.columns().find((c) => c.key === col.key);
    if (colDef?.onSave) {
      const out = col.type === 'number' ? (Number(val) || 0) : val;
      colDef.onSave(out, row, col.key);
    }
    this.editingCell.set(null);
  }

  cancelCellEdit(): void {
    this.editingCell.set(null);
  }

  // =========================
  // CELL HELPERS
  // =========================
  formatCell(row: unknown, col: DataSourceColumn): string {
    return this.formatter.format((row as Record<string, unknown>)[col.key], col);
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
    return (row as Record<string, unknown>)?.[key];
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
    return (obj as Record<string, unknown>)?.[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isArray(val: unknown): boolean {
    return Array.isArray(val);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isRowPropertyTruthy(row: unknown, key: string): boolean {
    return !!this.getRowProperty(row, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getArrayDisplay(item: unknown, col: DataSourceColumn): string {
    return typeof item === 'object'
      ? ((item as Record<string, unknown>)[col.arrayDisplayKey ?? 'label'] ?? JSON.stringify(item)) as string
      : String(item);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getValueColor(col: DataSourceColumn, _item: unknown): string {
    return ''; // Placeholder as color logic is usually handled via cellCssClass or booleanColors
  }

  // =========================
  // PAGINATION
  // =========================
  getPage(): number {
    const p = this.pagination();
    if (!p || 'hasNext' in p) return 1;
    return p.page ?? 1;
  }

  getSize(): number {
    const p = this.pagination();
    if (!p) return 10;
    if ('limit' in p) return p.limit;
    return p.size ?? 10;
  }

  onLoadMoreCursor(cursor: string): void {
    this.loadMore.emit(cursor);
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

  // Handler para z-checkbox en columnas booleanas
  onBooleanToggle(checked: boolean, col: DataSourceColumn, row: unknown): void {
    // Usa onToggle si está definido, como indica el tipo DataSourceColumn
    if (typeof col.onToggle === 'function') {
      col.onToggle(checked, row);
    } else {
      // Si no, intenta actualizar el valor directamente
      if (row && col.key) {
        (row as Record<string, unknown>)[col.key] = checked;
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
