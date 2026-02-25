import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { StudentStore } from '../../services/store/student.store';
import { Student, StudentCreate } from '../../types/student-types';
import { StudentForm } from '../../components/student-form/student-form';
import { StudentApi } from '../../services/api/student-api';
import { ExcelService } from '@core/services/excel.service';
import { ImportDialog } from '@shared/components/import-dialog/import-dialog';
import { STUDENT_HEADER_CONFIG } from '../../config/header.config';
import { STUDENT_COLUMN } from '../../config/column.config';
import { STUDENT_ACTIONS } from '../../config/action.config';

const EXCEL_COLUMNS = STUDENT_COLUMN.map((c) => ({ key: c.key, label: c.label }));

@Component({
  selector: 'sga-students',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './students.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentsPage {
  private dialog = inject(Dialog);
  private store = inject(StudentStore);
  private studentApi = inject(StudentApi);
  private excel = inject(ExcelService);

  headerConfig = computed(() => STUDENT_HEADER_CONFIG);
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
  headerActions = computed(() => STUDENT_ACTIONS.filter((a) => a.typeAction === 'header'));
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

  private openForm(current?: Student | null) {
    this.dialog.open(StudentForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }

  private downloadTemplate() {
    const blob = this.excel.generateTemplate(EXCEL_COLUMNS, {
      name: 'Ejemplo Estudiante',
      email: 'estudiante@ejemplo.com',
      age: 15,
      grade: '1ro',
    }, 'Estudiantes');
    this.excel.download(blob, 'plantilla_estudiantes.xlsx');
  }

  private openImport() {
    const ref = this.dialog.open(ImportDialog, {
      data: {
        title: 'Importar estudiantes',
        columns: EXCEL_COLUMNS,
        exampleRow: { name: 'Ejemplo', email: 'correo@ejemplo.com', age: 15, grade: '1ro' },
        templateSheetName: 'Estudiantes',
        validateRow: (row) => {
          if (!String(row['name'] ?? '').trim()) return 'Nombre requerido';
          if (!String(row['email'] ?? '').trim()) return 'Email requerido';
          const age = Number(row['age']);
          if (Number.isNaN(age) || age < 1 || age > 120) return 'Edad inválida (1-120)';
          return null;
        },
        importRows: (rows) =>
          this.studentApi.import(
            rows.map((r) => ({
              name: String(r['name'] ?? '').trim(),
              email: String(r['email'] ?? '').trim(),
              age: Number(r['age']) || 0,
              grade: String(r['grade'] ?? '').trim(),
            })) as StudentCreate[],
          ),
      },
      panelClass: 'dialog-top',
      width: '720px',
    });
    ref.closed.subscribe(() => this.store.loadAll({}));
  }

  private export() {
    this.studentApi.getAll({ size: 9999 }).subscribe((res) => {
      const data = (res.data ?? []).map((s) => ({ name: s.name, email: s.email, age: s.age, grade: s.grade }));
      const blob = this.excel.generate(EXCEL_COLUMNS, data, 'Estudiantes');
      this.excel.download(blob, `estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }
}
