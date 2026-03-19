import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ExcelService } from '@core/services/excel.service';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceManualForm } from '@features/teachers/components/teacher-attendance-manual-form/teacher-attendance-manual-form';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '@features/teachers/types/teacher-attendance-types';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ImportDialog } from '@shared/widgets/import-dialog/import-dialog';
import { forkJoin, map } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

type TeacherAttendanceRow = {
  teacherId: string;
  attendanceId?: string;
  teacherCode: string;
  teacherLabel: string;
  status: TeacherAttendanceStatus;
  checkInTime: string;
  observations: string;
  dirty?: boolean;
  markedForDelete: boolean;
};

const ATTENDANCE_COLUMNS = [
  { key: 'teacherCode', label: 'Codigo docente' },
  { key: 'status', label: 'Estado' },
  { key: 'checkInTime', label: 'Hora entrada' },
  { key: 'observations', label: 'Observaciones' }];

const HEADER_CONFIG = {
  title: 'Asistencia de Docentes',
  subtitle: 'Registro manual y por carga masiva de Excel',
  showActions: false,
  showFilters: false,
};


@Component({
  selector: 'sga-teacher-attendances',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderDetail, ZardInputDirective, ZardButtonComponent],
  templateUrl: './teacher-attendances.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherAttendancesPage implements OnInit {
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly dialog = inject(DialogModalService);
  private readonly confirmDialog = inject(DialogConfirmService);
  private readonly excel = inject(ExcelService);
  private readonly toast = inject(Toast);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly headerConfig = HEADER_CONFIG;
  readonly attendanceDate = signal(new Date().toISOString().slice(0, 10));
  readonly teacherContextId = signal('');
  readonly teacherContextName = signal('');
  readonly teachers = signal<{ id: string; teacherCode: string; specialization: string; firstName?: string; lastName?: string }[]>([]);
  readonly rows = signal<TeacherAttendanceRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly bulkDeleteMode = signal(false);
  readonly rowSyncing = signal<Set<string>>(new Set());
  readonly presentCount = computed(() => this.rows().filter((row) => row.status === 'present').length);
  readonly lateCount = computed(() => this.rows().filter((row) => row.status === 'late').length);
  readonly absentCount = computed(() => this.rows().filter((row) => row.status === 'absent').length);
  readonly excusedCount = computed(() => this.rows().filter((row) => row.status === 'excused').length);
  readonly dirtyCount = computed(() => this.rows().filter((row) => !!row.dirty).length);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.teacherContextId.set(params.get('teacherId') ?? '');
      this.teacherContextName.set(params.get('teacherName') ?? '');
      this.loadTeachers();
    });
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.teacherAttendanceApi.getTeachers().subscribe({
      next: (response) => {
        const teacherContextId = this.teacherContextId();
        const list = (response.data ?? []).filter((teacher) => !teacherContextId || teacher.id === teacherContextId);
        this.teachers.set(list);
        this.rows.set(
          list.map((teacher) => ({
            teacherId: teacher.id,
            teacherCode: teacher.teacherCode,
            teacherLabel: `${teacher.teacherCode} - ${[teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.specialization}`,
            status: 'present',
            checkInTime: '08:00:00',
            observations: '',
            dirty: false,
            markedForDelete: false,
          })),
        );
        this.loading.set(false);
        this.loadAttendancesByDate();
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(error?.error?.message ?? error?.message ?? 'No se pudo cargar docentes');
      },
    });
  }

  onDateChange(value: unknown): void {
    this.attendanceDate.set(String(value ?? '').slice(0, 10));
    this.loadAttendancesByDate();
  }

  openManualDialog(): void {
    const ref = this.dialog.open(TeacherAttendanceManualForm, {
      data: {
        date: this.attendanceDate(),
        teachers: this.teachers(),
      },
      panelClass: 'dialog-top',
      width: '560px',
    });

    ref.closed.subscribe((created) => {
      if (created) {
        this.loadAttendancesByDate();
      }
    });
  }

  setStatus(teacherId: string, status: TeacherAttendanceStatus): void {
    const currentRow = this.rows().find((row) => row.teacherId === teacherId);
    if (!currentRow || currentRow.status === status || this.rowSyncing().has(teacherId)) return;

    const previousStatus = currentRow.status;
    this.rows.update((current) =>
      current.map((row) => (row.teacherId === teacherId ? { ...row, status, dirty: true } : row)),
    );

    this.setRowSyncing(teacherId, true);

    if (currentRow.attendanceId) {
      this.teacherAttendanceApi
        .update(currentRow.attendanceId, {
          status,
          checkInTime: this.normalizeTime(currentRow.checkInTime),
          observations: currentRow.observations || undefined,
        })
        .subscribe({
          next: () => this.setRowSyncing(teacherId, false),
          error: (error) => {
            this.setRowSyncing(teacherId, false);
            this.rows.update((rows) =>
              rows.map((row) =>
                row.teacherId === teacherId ? { ...row, status: previousStatus } : row,
              ),
            );
            this.toast.error(
              error?.error?.message ?? error?.message ?? 'No se pudo actualizar la asistencia',
            );
          },
        });
      return;
    }

    this.teacherAttendanceApi
      .registerBulk({
        date: this.attendanceDate(),
        attendances: [
          {
            teacherCode: currentRow.teacherCode,
            status,
            checkInTime: this.normalizeTime(currentRow.checkInTime),
            observations: currentRow.observations || undefined,
          }],
      })
      .subscribe({
        next: () => {
          this.setRowSyncing(teacherId, false);
          this.loadAttendancesByDate();
        },
        error: (error) => {
          this.setRowSyncing(teacherId, false);
          this.rows.update((rows) =>
            rows.map((row) =>
              row.teacherId === teacherId ? { ...row, status: previousStatus } : row,
            ),
          );
          this.toast.error(
            error?.error?.message ?? error?.message ?? 'No se pudo registrar la asistencia',
          );
        },
      });
  }

  updateCheckInTime(teacherId: string, value: unknown): void {
    const parsed = String(value ?? '').trim();
    this.rows.update((current) =>
      current.map((row) =>
        row.teacherId === teacherId ? { ...row, checkInTime: parsed, dirty: true } : row,
      ),
    );
  }

  updateObservations(teacherId: string, value: unknown): void {
    const parsed = String(value ?? '').trim();
    this.rows.update((current) =>
      current.map((row) =>
        row.teacherId === teacherId ? { ...row, observations: parsed, dirty: true } : row,
      ),
    );
  }

  toggleDelete(attendanceId: string | undefined, value: boolean): void {
    if (!attendanceId) return;
    this.rows.update((current) =>
      current.map((row) =>
        row.attendanceId === attendanceId ? { ...row, markedForDelete: value } : row,
      ),
    );
    this.syncBulkModeFromSelection();
  }

  toggleBulkDeleteMode(value: boolean): void {
    this.bulkDeleteMode.set(value);
    if (value) {
      this.rows.update((current) =>
        current.map((row) =>
          row.attendanceId ? { ...row, markedForDelete: true } : { ...row, markedForDelete: false },
        ),
      );
      return;
    }
    this.rows.update((current) => current.map((row) => ({ ...row, markedForDelete: false })));
  }

  toggleAllSelection(): void {
    const allSelected = this.allSelected();
    this.rows.update((current) =>
      current.map((row) =>
        row.attendanceId ? { ...row, markedForDelete: !allSelected } : row,
      ),
    );
    this.bulkDeleteMode.set(!allSelected);
  }

  allSelected(): boolean {
    const selectable = this.rows().filter((row) => row.attendanceId);
    return selectable.length > 0 && selectable.every((row) => row.markedForDelete);
  }

  partialSelected(): boolean {
    const selectable = this.rows().filter((row) => row.attendanceId);
    const selected = selectable.filter((row) => row.markedForDelete).length;
    return selected > 0 && selected < selectable.length;
  }

  private syncBulkModeFromSelection(): void {
    const anySelected = this.rows().some((row) => row.attendanceId && row.markedForDelete);
    this.bulkDeleteMode.set(anySelected);
  }

  async onRowDeleteToggle(teacherId: string, value: boolean): Promise<void> {
    if (this.isRowDeleteDisabled(teacherId)) return;
    if (this.bulkDeleteMode()) return;

    if (!value) return;

    const row = this.rows().find((item) => item.teacherId === teacherId);
    if (!row || !row.attendanceId) return;

    const confirmed = await this.confirmDialog.open({
      type: 'danger',
      icon: 'fa-solid fa-triangle-exclamation',
      title: 'Eliminar asistencia',
      message: `Se eliminará la asistencia de ${row.teacherLabel}. Esta acción no se puede deshacer.`,
      acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default', size: 'default' },
      rejectButtonProps: { label: 'Cancelar', color: 'secondary', zType: 'outline', size: 'default' },
    });

    if (!confirmed) {
      this.toggleDelete(teacherId, false);
      return;
    }

    this.setRowSyncing(teacherId, true);
    this.teacherAttendanceApi.delete(row.attendanceId).subscribe({
      next: () => {
        this.setRowSyncing(teacherId, false);
        this.toast.success('Asistencia eliminada correctamente.');
        this.loadAttendancesByDate();
      },
      error: (error) => {
        this.setRowSyncing(teacherId, false);
        this.toast.error(
          error?.error?.message ?? error?.message ?? 'No se pudo eliminar la asistencia',
        );
      },
    });
  }

  async deleteRow(teacherId: string): Promise<void> {
    if (this.isRowDeleteDisabled(teacherId)) return;
    const row = this.rows().find((item) => item.teacherId === teacherId);
    if (!row || !row.attendanceId) return;

    const confirmed = await this.confirmDialog.open({
      type: 'danger',
      icon: 'fa-solid fa-triangle-exclamation',
      title: 'Eliminar asistencia',
      message: `Se eliminará la asistencia de ${row.teacherLabel}. Esta acción no se puede deshacer.`,
      acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default', size: 'default' },
      rejectButtonProps: { label: 'Cancelar', color: 'secondary', zType: 'outline', size: 'default' },
    });

    if (!confirmed) return;

    this.setRowSyncing(teacherId, true);
    this.teacherAttendanceApi.delete(row.attendanceId).subscribe({
      next: () => {
        this.setRowSyncing(teacherId, false);
        this.toast.success('Asistencia eliminada correctamente.');
        this.loadAttendancesByDate();
      },
      error: (error) => {
        this.setRowSyncing(teacherId, false);
        this.toast.error(
          error?.error?.message ?? error?.message ?? 'No se pudo eliminar la asistencia',
        );
      },
    });
  }

  async deleteSelected(): Promise<void> {
    const selected = this.rows().filter((row) => row.markedForDelete);
    if (selected.length === 0) {
      this.toast.info('Selecciona al menos una asistencia para eliminar.');
      return;
    }

    const deletable = selected.filter((row) => row.attendanceId);
    if (deletable.length === 0) {
      this.toast.info('Las asistencias seleccionadas no están registradas.');
      return;
    }

    const confirmed = await this.confirmDialog.open({
      type: 'danger',
      icon: 'fa-solid fa-triangle-exclamation',
      title: 'Eliminar asistencias',
      message: `Se eliminarán ${deletable.length} asistencias. Esta acción no se puede deshacer.`,
      acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default', size: 'default' },
      rejectButtonProps: { label: 'Cancelar', color: 'secondary', zType: 'outline', size: 'default' },
    });

    if (!confirmed) return;

    this.deleting.set(true);
    deletable.forEach((row) => this.setRowSyncing(row.teacherId, true));

    forkJoin(deletable.map((row) => this.teacherAttendanceApi.delete(row.attendanceId!))).subscribe({
      next: () => {
        this.deleting.set(false);
        deletable.forEach((row) => this.setRowSyncing(row.teacherId, false));
        this.toast.success('Asistencias eliminadas correctamente.');
        this.loadAttendancesByDate();
      },
      error: (error) => {
        this.deleting.set(false);
        deletable.forEach((row) => this.setRowSyncing(row.teacherId, false));
        this.toast.error(
          error?.error?.message ?? error?.message ?? 'No se pudo eliminar la asistencia',
        );
      },
    });
  }

  hasDeleteSelections(): boolean {
    return this.rows().some((row) => row.markedForDelete);
  }

  isRowDeleteDisabled(teacherId: string): boolean {
    const row = this.rows().find((item) => item.teacherId === teacherId);
    if (!row) return true;
    return !row.attendanceId || this.isRowSyncing(row.teacherId) || this.deleting();
  }

  saveManual(): void {
    const dirtyRows = this.rows().filter((row) => row.dirty);
    if (dirtyRows.length === 0) {
      this.toast.info('No hay cambios manuales para guardar.');
      return;
    }

    this.saving.set(true);
    this.teacherAttendanceApi
      .registerBulk({
        date: this.attendanceDate(),
        attendances: dirtyRows.map((row) => ({
          teacherCode: row.teacherCode,
          status: row.status,
          checkInTime: this.normalizeTime(row.checkInTime),
          observations: row.observations || undefined,
        })),
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.toast.success(`${response.message}. Procesados: ${response.processed}`);
            this.loadAttendancesByDate();
          } else {
            this.toast.error(response.message);
          }
        },
        error: (error) => {
          this.saving.set(false);
          this.toast.error(
            error?.error?.message ?? error?.message ?? 'No se pudo guardar asistencias',
          );
        },
      });
  }

  openImportDialog(): void {
    const ref = this.dialog.open(ImportDialog, {
      data: {
        title: 'Importar asistencia de docentes',
        columns: ATTENDANCE_COLUMNS,
        exampleRow: {
          teacherCode: 'T20250001',
          status: 'present',
          checkInTime: '08:00:00',
          observations: '',
        },
        templateSheetName: 'AsistenciaDocentes',
        validateRow: (row: Record<string, unknown>) => {
          if (!String(row['teacherCode'] ?? '').trim()) return 'Codigo docente requerido';
          const status = this.parseStatus(row['status']);
          if (!status) return 'Estado invalido (present/absent/late/excused)';
          return null;
        },
        importRows: (rows: Record<string, unknown>[]) =>
          this.teacherAttendanceApi
            .registerBulk({
              date: this.attendanceDate(),
              attendances: rows
                .map((row) => ({
                  teacherCode: String(row['teacherCode'] ?? '').trim(),
                  status: this.parseStatus(row['status']) ?? 'present',
                  checkInTime: this.normalizeTime(row['checkInTime']),
                  observations: String(row['observations'] ?? '').trim() || undefined,
                }))
                .filter((item) => item.teacherCode),
            })
            .pipe(
              map((res) => ({
                created: res.processed ?? 0,
                errors: (res.errors ?? []).map((msg, i) => ({
                  row: i,
                  message: msg,
                })),
              })),
            ),
      },
      panelClass: 'dialog-top',
      width: '720px',
    });

    ref.closed.subscribe(() => this.loadAttendancesByDate());
  }

  downloadTemplate(): void {
    this.excel.downloadTemplate(
      ATTENDANCE_COLUMNS,
      {
        teacherCode: 'T20250001',
        status: 'present',
        checkInTime: '08:00:00',
        observations: 'Ingreso puntual',
      },
      { sheetName: 'AsistenciaDocentes', fileName: 'plantilla_asistencia_docentes.xlsx' },
    );
  }

  clearTeacherContext(): void {
    this.router.navigate(['/teachers/attendances']);
  }

  private loadAttendancesByDate(): void {
    if (this.teachers().length === 0) return;

    const teacherId = this.teacherContextId();
    this.teacherAttendanceApi.getAll({ date: this.attendanceDate(), ...(teacherId ? { teacher: teacherId } : {}) }).subscribe({
      next: (res) => {
        const selectedAttendanceIds = new Set(
          this.rows()
            .filter((row) => row.markedForDelete && row.attendanceId)
            .map((row) => row.attendanceId as string),
        );
        const bulkMode = this.bulkDeleteMode();
        const teacherCodeById = new Map(this.teachers().map((teacher) => [teacher.id, teacher.teacherCode]));
        const attendanceByCode = new Map<string, TeacherAttendance>();

        (res.data ?? []).forEach((attendance) => {
          const code = this.extractTeacherCode(attendance, teacherCodeById);
          if (code) {
            attendanceByCode.set(code, attendance);
          }
        });

        this.rows.update((current) =>
          current.map((row) => {
            const existing = attendanceByCode.get(row.teacherCode);
            if (!existing || !existing.id) {
              return {
                ...row,
                attendanceId: undefined,
                dirty: false,
                markedForDelete: false,
              };
            }

            return {
              ...row,
              attendanceId: existing.id,
              status: existing.status ?? row.status,
              checkInTime: this.normalizeTime(existing.checkInTime ?? row.checkInTime),
              observations: existing.observations ?? row.observations,
              dirty: false,
              markedForDelete: bulkMode ? true : selectedAttendanceIds.has(existing.id),
            };
          }),
        );
        this.syncBulkModeFromSelection();
      },
    });
  }

  isRowSyncing(teacherId: string): boolean {
    return this.rowSyncing().has(teacherId);
  }

  private parseStatus(value: unknown): TeacherAttendanceStatus | null {
    const raw = String(value ?? '')
      .trim()
      .toLowerCase();

    if (['present', 'presente', 'p'].includes(raw)) return 'present';
    if (['absent', 'falta', 'ausente', 'f'].includes(raw)) return 'absent';
    if (['late', 'tardanza', 'tarde', 't'].includes(raw)) return 'late';
    if (['excused', 'justificado', 'justificada', 'j'].includes(raw)) return 'excused';
    return null;
  }

  private normalizeTime(value: unknown): string {
    const raw = String(value ?? '08:00:00').trim();
    if (!raw) return '08:00:00';
    if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
    if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
    return '08:00:00';
  }

  private extractTeacherCode(
    attendance: TeacherAttendance,
    teacherCodeById: Map<string, string>,
  ): string | null {
    if (attendance.teacherCode) return attendance.teacherCode;

    const teacher = attendance.teacher;
    if (!teacher) return null;

    if (typeof teacher === 'string') {
      return teacherCodeById.get(teacher) ?? null;
    }

    if (teacher.teacherCode) return teacher.teacherCode;
    if (teacher.id) return teacherCodeById.get(teacher.id) ?? null;

    return null;
  }

  private setRowSyncing(teacherId: string, syncing: boolean): void {
    this.rowSyncing.update((current) => {
      const next = new Set(current);
      if (syncing) next.add(teacherId);
      else next.delete(teacherId);
      return next;
    });
  }
}
