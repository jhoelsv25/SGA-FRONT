import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ExcelService } from '@core/services/excel.service';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { Toast } from '@core/services/toast';
import { ImportWithProgressDialog } from '../../components/import-with-progress-dialog/import-with-progress-dialog';
import { StudentForm } from '../../components/student-form/student-form';
import { StudentCardComponent } from '../../components/student-card/student-card';
import { STUDENT_ACTIONS } from '../../config/action.config';
import { STUDENT_COLUMN } from '../../config/column.config';
import { StudentApi } from '../../services/api/student-api';
import { StudentStore } from '../../services/store/student.store';
import { Student } from '../../types/student-types';

const EXCEL_COLUMNS = STUDENT_COLUMN.map((c) => ({ key: c.key, label: c.label }));

type ImportResult = { created: number; errors: { row: number; message: string }[] } | null;

@Component({
  selector: 'sga-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderDetail,
    StudentCardComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardInputDirective,
    ZardButtonComponent,
    ...ZardFormImports,
  ],
  templateUrl: './students.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentsPage {
  private readonly dialog = inject(DialogModalService);
  private readonly store = inject(StudentStore);
  private readonly studentApi = inject(StudentApi);
  private readonly excel = inject(ExcelService);
  private readonly permissionStore = inject(PermissionCheckStore);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly searchTerm = signal('');
  readonly actions = STUDENT_ACTIONS;
  readonly headerConfig = {
    title: 'Estudiantes',
    subtitle: 'Gestión integral de estudiantes del sistema',
    showActions: true,
    showFilters: true,
  };

  readonly canManageStudents = computed(() => this.permissionStore.has('manage_student'));
  readonly loading = computed(() => this.store.loading());
  readonly data = computed(() => this.store.students());
  readonly filteredData = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.data();
    return this.data().filter((s) =>
      s.firstName?.toLowerCase().includes(search) ||
      s.lastName?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search) ||
      s.studentCode?.toLowerCase().includes(search) ||
      String(s.grade ?? '').toLowerCase().includes(search),
    );
  });
  readonly hasActiveFilters = computed(() => !!this.searchTerm().trim());
  readonly headerActions = computed(() =>
    this.permissionStore.filterActions(this.actions.filter((a) => a.typeAction === 'header')),
  );

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm.set(params.get('search') ?? '');
      this.store.loadAll({ size: 999 });
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
    if (e.action.key === 'downloadTemplate') this.downloadTemplate();
    if (e.action.key === 'import') this.openImport();
    if (e.action.key === 'export') this.export();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearFilters() {
    this.searchTerm.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onRefresh() {
    this.store.loadAll({ size: 999 });
  }

  editStudent(student: Student) {
    this.openForm(student);
  }

  goToDetail(student: Student) {
    this.router.navigate(['/students', student.id], {
      state: { student },
    });
  }

  deleteStudent(student: Student) {
    this.store.delete(student.id).subscribe();
  }

  goToEnrollments(student: Student) {
    this.router.navigate(['/students/enrollments'], {
      queryParams: {
        studentId: student.id,
        studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.studentCode,
      },
    });
  }

  goToGuardians(student: Student) {
    this.router.navigate(['/students/guardians'], {
      queryParams: {
        studentId: student.id,
        studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.studentCode,
      },
    });
  }

  goToAttendance(student: Student) {
    this.router.navigate(['/attendance/register'], {
      queryParams: {
        studentId: student.id,
        studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.studentCode,
      },
    });
  }

  goToObservations(student: Student) {
    this.router.navigate(['/students/observations'], {
      queryParams: {
        studentId: student.id,
        studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.studentCode,
      },
    });
  }

  createFromEmpty() {
    if (!this.canManageStudents()) return;
    this.openForm();
  }

  private openForm(current?: Student | null) {
    const ref = this.dialog.open(StudentForm, {
      data: { current: current ?? null },
      width: '880px',
      maxHeight: '80vh',
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
        studentCode: 'A2024001',
      },
      { sheetName: 'Estudiantes', fileName: 'plantilla_estudiantes.xlsx' },
    );
  }

  private openImport() {
    const ref = this.dialog.open<ImportResult | null, void, ImportWithProgressDialog>(ImportWithProgressDialog, {
      width: '960px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe((result) => {
      this.onRefresh();
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
