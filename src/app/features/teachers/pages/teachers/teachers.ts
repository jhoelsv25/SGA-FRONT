import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { TeacherStore } from '../../services/store/teacher.store';
import { Teacher } from '../../types/teacher-types';
import { TeacherForm } from '../../components/teacher-form/teacher-form';
import { TeacherApi } from '../../services/api/teacher-api';
import { ExcelService } from '@core/services/excel.service';
import { ImportDialog } from '@shared/components/import-dialog/import-dialog';
import { TEACHER_HEADER_CONFIG } from '../../config/header.config';
import { TEACHER_COLUMN } from '../../config/column.config';
import { TEACHER_ACTIONS } from '../../config/action.config';

const EXCEL_COLUMNS = TEACHER_COLUMN.map((c) => ({ key: c.key, label: c.label }));

function parseDate(v: unknown): string {
  if (v == null || v === '') return new Date().toISOString().slice(0, 10);
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  return String(v).trim().slice(0, 10);
}

function parseBoolean(v: unknown): boolean {
  if (v === true || v === 1) return true;
  const s = String(v ?? '').toLowerCase();
  return s === 'sí' || s === 'si' || s === 'true' || s === '1' || s === 'yes';
}

@Component({
  selector: 'sga-teachers',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './teachers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeachersPage {
  private dialog = inject(Dialog);
  private store = inject(TeacherStore);
  private teacherApi = inject(TeacherApi);
  private excel = inject(ExcelService);

  headerConfig = computed(() => TEACHER_HEADER_CONFIG);
  columns = computed(() =>
    TEACHER_COLUMN.map((col) => {
      if (col.type === 'boolean' && col.key === 'isActive') {
        return {
          ...col,
          editable: true,
          onToggle: (checked: boolean, row: unknown) =>
            this.store.update((row as Teacher).id, { isActive: checked }),
        };
      }
      return {
        ...col,
        editable: col.type !== 'boolean',
        onSave: (newVal: unknown, row: unknown, key: string) => {
          const id = (row as Teacher).id;
          if (key === 'hireDate') {
            this.store.update(id, { hireDate: String(newVal).slice(0, 10) });
          } else {
            this.store.update(id, { [key]: newVal });
          }
        },
      };
    }),
  );
  data = computed(() => this.store.teachers());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => TEACHER_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => TEACHER_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
    if (e.action.key === 'downloadTemplate') this.downloadTemplate();
    if (e.action.key === 'import') this.openImport();
    if (e.action.key === 'export') this.export();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Teacher;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  private openForm(current?: Teacher | null) {
    this.dialog.open(TeacherForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }

  private downloadTemplate() {
    const blob = this.excel.generateTemplate(
      EXCEL_COLUMNS,
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'docente@ejemplo.com',
        subject: 'Matemáticas',
        hireDate: new Date().toISOString().slice(0, 10),
        isActive: 'Sí',
      },
      'Docentes',
    );
    this.excel.download(blob, 'plantilla_docentes.xlsx');
  }

  private openImport() {
    const ref = this.dialog.open(ImportDialog, {
      data: {
        title: 'Importar docentes',
        columns: EXCEL_COLUMNS,
        exampleRow: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'docente@ejemplo.com',
          subject: 'Matemáticas',
          hireDate: new Date().toISOString().slice(0, 10),
          isActive: 'Sí',
        },
        templateSheetName: 'Docentes',
        validateRow: (row) => {
          if (!String(row['firstName'] ?? '').trim()) return 'Nombre requerido';
          if (!String(row['lastName'] ?? '').trim()) return 'Apellido requerido';
          if (!String(row['email'] ?? '').trim()) return 'Email requerido';
          return null;
        },
        importRows: (rows) =>
          this.teacherApi.import(
            rows.map((r) => ({
              firstName: String(r['firstName'] ?? '').trim(),
              lastName: String(r['lastName'] ?? '').trim(),
              email: String(r['email'] ?? '').trim(),
              subject: String(r['subject'] ?? '').trim(),
              hireDate: parseDate(r['hireDate']),
              isActive: parseBoolean(r['isActive']),
            })),
          ),
      },
      panelClass: 'dialog-top',
      width: '720px',
    });
    ref.closed.subscribe(() => this.store.loadAll({}));
  }

  private export() {
    this.teacherApi.getAll({ size: 9999 }).subscribe((res) => {
      const data = (res.data ?? []).map((t) => ({
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        subject: t.subject,
        hireDate: t.hireDate?.slice(0, 10) ?? '',
        isActive: t.isActive ? 'Sí' : 'No',
      }));
      const blob = this.excel.generate(EXCEL_COLUMNS, data, 'Docentes');
      this.excel.download(blob, `docentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}
