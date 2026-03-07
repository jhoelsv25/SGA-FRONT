import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExcelService } from '@core/services/excel.service';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '@features/teachers/types/teacher-attendance-types';
import { Button } from '@shared/directives';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ImportDialog } from '@shared/components/import-dialog/import-dialog';
import { Input } from '@shared/ui/input/input';
import { Select, SelectOption } from '@shared/ui/select/select';
import { map } from 'rxjs';

type TeacherAttendanceRow = {
  teacherId: string;
  attendanceId?: string;
  teacherCode: string;
  teacherLabel: string;
  status: TeacherAttendanceStatus;
  checkInTime: string;
  observations: string;
  dirty?: boolean;
};

const ATTENDANCE_COLUMNS = [
  { key: 'teacherCode', label: 'Codigo docente' },
  { key: 'status', label: 'Estado' },
  { key: 'checkInTime', label: 'Hora entrada' },
  { key: 'observations', label: 'Observaciones' },
];

const HEADER_CONFIG = {
  title: 'Asistencia de Docentes',
  subtitle: 'Registro manual y por carga masiva de Excel',
  showActions: false,
  showFilters: false,
};

@Component({
  selector: 'sga-teacher-attendances',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderDetail, Input, Button, Select],
  templateUrl: './teacher-attendances.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherAttendancesPage implements OnInit {
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly dialog = inject(Dialog);
  private readonly excel = inject(ExcelService);
  private readonly toast = inject(Toast);

  readonly headerConfig = HEADER_CONFIG;
  readonly attendanceDate = signal(new Date().toISOString().slice(0, 10));
  readonly teachers = signal<{ id: string; teacherCode: string; specialization: string }[]>([]);
  readonly rows = signal<TeacherAttendanceRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly rowSyncing = signal<Set<string>>(new Set());

  readonly manualTeacherId = signal('');
  readonly manualStatus = signal<TeacherAttendanceStatus>('present');
  readonly manualCheckInTime = signal('08:00');
  readonly manualObservations = signal('');
  readonly manualTeacherOptions = signal<SelectOption[]>([]);

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.teacherAttendanceApi.getTeachers().subscribe({
      next: (response) => {
        const list = response.data ?? [];
        this.teachers.set(list);
        this.manualTeacherOptions.set([
          { value: '', label: 'Seleccione docente...' },
          ...list.map((t) => ({ value: t.id, label: `${t.teacherCode} - ${t.specialization}` })),
        ]);
        this.rows.set(
          list.map((teacher) => ({
            teacherId: teacher.id,
            teacherCode: teacher.teacherCode,
            teacherLabel: `${teacher.teacherCode} - ${teacher.specialization}`,
            status: 'present',
            checkInTime: '08:00:00',
            observations: '',
            dirty: false,
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

  onManualStatusChange(value: unknown): void {
    const v = String(value ?? '').trim();
    if (v === 'present' || v === 'late' || v === 'absent' || v === 'excused') {
      this.manualStatus.set(v);
      return;
    }
    this.manualStatus.set('present');
  }

  onManualTeacherChange(value: unknown): void {
    this.manualTeacherId.set(value == null ? '' : `${value}`);
  }

  onManualCheckInTimeChange(value: unknown): void {
    this.manualCheckInTime.set(value == null ? '08:00' : `${value}`);
  }

  onManualObservationsChange(value: unknown): void {
    this.manualObservations.set(value == null ? '' : `${value}`);
  }

  addManualRecord(): void {
    const teacherId = this.manualTeacherId();
    if (!teacherId) {
      this.toast.warning('Seleccione un docente.');
      return;
    }

    const teacher = this.teachers().find((t) => t.id === teacherId);
    if (!teacher) {
      this.toast.error('Docente no encontrado.');
      return;
    }

    const status = this.manualStatus();
    const checkInTime = this.normalizeTime(this.manualCheckInTime());
    const observations = this.manualObservations().trim();

    this.rows.update((current) =>
      current.map((row) =>
        row.teacherId === teacherId
          ? {
              ...row,
              status,
              checkInTime,
              observations,
              dirty: true,
            }
          : row,
      ),
    );

    this.toast.success('Registro manual agregado. Presione "Guardar asistencia manual".');
    this.manualStatus.set('present');
    this.manualCheckInTime.set('08:00');
    this.manualObservations.set('');
  }

  createManualRecord(): void {
    const teacherId = this.manualTeacherId();
    if (!teacherId) {
      this.toast.warning('Seleccione un docente.');
      return;
    }

    const teacher = this.teachers().find((t) => t.id === teacherId);
    if (!teacher) {
      this.toast.error('Docente no encontrado.');
      return;
    }

    this.creating.set(true);
    this.teacherAttendanceApi
      .registerBulk({
        date: this.attendanceDate(),
        attendances: [
          {
            teacherCode: teacher.teacherCode,
            status: this.manualStatus(),
            checkInTime: this.normalizeTime(this.manualCheckInTime()),
            observations: this.manualObservations().trim() || undefined,
          },
        ],
      })
      .subscribe({
        next: (res) => {
          this.creating.set(false);
          if (res.success) {
            this.toast.success('Asistencia creada correctamente.');
            this.manualStatus.set('present');
            this.manualCheckInTime.set('08:00');
            this.manualObservations.set('');
            this.loadAttendancesByDate();
          } else {
            this.toast.error(res.message);
          }
        },
        error: (error) => {
          this.creating.set(false);
          this.toast.error(
            error?.error?.message ?? error?.message ?? 'No se pudo crear la asistencia',
          );
        },
      });
  }

  setStatus(teacherId: string, status: TeacherAttendanceStatus): void {
    const currentRow = this.rows().find((row) => row.teacherId === teacherId);
    if (!currentRow || currentRow.status === status || this.rowSyncing().has(teacherId)) return;

    const previousStatus = currentRow.status;
    this.rows.update((current) =>
      current.map((row) =>
        row.teacherId === teacherId ? { ...row, status, dirty: true } : row,
      ),
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
          },
        ],
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
    const blob = this.excel.generateTemplate(
      ATTENDANCE_COLUMNS,
      {
        teacherCode: 'T20250001',
        status: 'present',
        checkInTime: '08:00:00',
        observations: 'Ingreso puntual',
      },
      'AsistenciaDocentes',
    );
    this.excel.download(blob, 'plantilla_asistencia_docentes.xlsx');
  }

  private loadAttendancesByDate(): void {
    if (this.teachers().length === 0) return;

    this.teacherAttendanceApi.getAll({ date: this.attendanceDate() }).subscribe({
      next: (res) => {
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
            if (!existing) {
              return {
                ...row,
                attendanceId: undefined,
                status: 'present',
                checkInTime: '08:00:00',
                observations: '',
                dirty: false,
              };
            }
            return {
              ...row,
              attendanceId: existing.id,
              status: existing.status ?? row.status,
              checkInTime: this.normalizeTime(existing.checkInTime ?? row.checkInTime),
              observations: existing.observations ?? row.observations,
              dirty: false,
            };
          }),
        );
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
