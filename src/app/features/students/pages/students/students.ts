import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { StudentStore } from '../../services/store/student.store';
import { Student } from '../../types/student-types';
import { StudentForm } from '../../components/student-form/student-form';
import { StudentApi } from '../../services/api/student-api';
import { ExcelService } from '@core/services/excel.service';
import { ImportWithProgressDialog } from '../../components/import-with-progress-dialog/import-with-progress-dialog';
import { STUDENT_COLUMN } from '../../config/column.config';
import { STUDENT_ACTIONS } from '../../config/action.config';
import { ListToolbar } from '@shared/widgets/ui/list-toolbar';
import { Dropdown, DropdownItem } from '@shared/adapters/ui/dropdown/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { Toast } from '@core/services/toast';

const EXCEL_COLUMNS = STUDENT_COLUMN.map((c) => ({ key: c.key, label: c.label }));

type ImportResult = { created: number; errors: { row: number; message: string }[] } | null;

@Component({
  selector: 'sga-students',
  standalone: true,
  imports: [ListToolbar, DataSource, Dropdown],
  templateUrl: './students.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentsPage implements OnInit {
  private dialog = inject(DialogModalService);
  private store = inject(StudentStore);
  private studentApi = inject(StudentApi);
  private excel = inject(ExcelService);
  private permissionStore = inject(PermissionCheckStore);
  private toast = inject(Toast);
  private route = inject(ActivatedRoute);

  searchTerm = signal('');

  headerActions = computed(() =>
    this.permissionStore.filterActions(STUDENT_ACTIONS.filter((a) => a.typeAction === 'header')),
  );
  toolbarMoreItems = computed<DropdownItem[]>(() => {
    const actions = this.headerActions().filter((a) => a.key !== 'refresh');
    const createIdx = actions.findIndex((a) => a.key === 'create');
    const create = createIdx >= 0 ? actions[createIdx] : null;
    const rest = actions.filter((a) => a.key !== 'create');
    const items: DropdownItem[] = [];
    if (create) {
      items.push({
        label: 'Nuevo',
        icon: create.icon,
        disabled: typeof create.disabled === 'function' ? create.disabled({}) : !!create.disabled,
        action: () => this.onHeaderAction({ action: create, context: {} }),
      });
    }
    if (rest.length > 0) {
      items.push({ label: '', separator: true });
      items.push({ label: 'Acciones', disabled: true });
      rest.forEach((action) => {
        items.push({
          label: action.label,
          icon: action.icon,
          disabled: typeof action.disabled === 'function' ? action.disabled({}) : !!action.disabled,
          action: () => this.onHeaderAction({ action, context: {} }),
        });
      });
    }
    return items;
  });
  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return list;
    return list.filter(
      (s) =>
        s.firstName?.toLowerCase().includes(search) ||
        s.lastName?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        String(s.grade ?? '').toLowerCase().includes(search),
    );
  });

  columns = computed(() =>
    STUDENT_COLUMN.map((col) => ({
      ...col,
      editable: true,
      onSave: (newVal: unknown, row: unknown, key: string) => {
        const id = (row as Student).id;
        const payload = key === 'age' ? { age: Number(newVal) || 0 } : { [key]: newVal };
        this.store.update(id, payload);
      },
    })),
  );
  data = computed(() => this.store.students());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  rowActions = computed(() => STUDENT_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
    if (e.action.key === 'downloadTemplate') this.downloadTemplate();
    if (e.action.key === 'import') this.openImport();
    if (e.action.key === 'export') this.export();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Student;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onRefresh() {
    this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
  }

  ngOnInit() {
    this.store.loadAll({});
  }

  private openForm(current?: Student | null) {
    const ref = this.dialog.open(StudentForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '880px',
      height: '650px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  private downloadTemplate() {
    this.excel.downloadTemplate(
      EXCEL_COLUMNS,
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'estudiante@ejemplo.com',
        age: 15,
        grade: '1ro',
        studentCode: 'A2024001',
      },
      { sheetName: 'Estudiantes', fileName: 'plantilla_estudiantes.xlsx' },
    );
  }

  private openImport() {
    const ref = this.dialog.open<ImportResult | null, void, ImportWithProgressDialog>(ImportWithProgressDialog, {
      panelClass: 'dialog-center',
      width: '960px',
      height: '700px',
    });
    ref.closed.subscribe((result) => {
      this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
      if (result?.created != null && result.created > 0) {
        this.toast.success(`Importación completada: ${result.created} estudiante(s) creado(s)`);
      }
    });
  }

  private export() {
    this.studentApi.getAll({ size: 9999 }).subscribe((res) => {
      const data = (res.data ?? []).map((s) => ({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        age: s.age,
        grade: s.grade,
        studentCode: s.studentCode,
      }));
      this.excel.downloadExport(EXCEL_COLUMNS, data, {
        sheetName: 'Estudiantes',
        fileName: `estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    });
  }
}
