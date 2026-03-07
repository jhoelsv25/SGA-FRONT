import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExcelService } from '@core/services/excel.service';
import { Toast } from '@core/services/toast';
import { TeacherApi } from '@features/teachers/services/api/teacher-api';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '@features/teachers/types/teacher-attendance-types';
import { Teacher } from '@features/teachers/types/teacher-types';
import { Button } from '@shared/directives';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ImportDialog } from '@shared/components/import-dialog/import-dialog';
import { Input } from '@shared/ui/input/input';
import { map } from 'rxjs';

type TeacherAttendanceRow = {
  teacherId: string;
  teacherCode: string;
  teacherLabel: string;
  status: TeacherAttendanceStatus;
  checkInTime: string;
  observations: string;
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
  imports: [CommonModule, FormsModule, HeaderDetail, Input, Button],
  templateUrl: './teacher-attendances.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherAttendancesPage implements OnInit {
  private readonly teacherApi = inject(TeacherApi);
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly dialog = inject(Dialog);
  private readonly excel = inject(ExcelService);
  private readonly toast = inject(Toast);

  readonly headerConfig = HEADER_CONFIG;
  readonly attendanceDate = signal(new Date().toISOString().slice(0, 10));
  readonly teachers = signal<Teacher[]>([]);
  readonly rows = signal<TeacherAttendanceRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.teacherApi.getAll({ page: 1, size: 9999 }).subscribe({
      next: (response) => {
        const list = response.data ?? [];
        this.teachers.set(list);
        this.rows.set(
          list.map((teacher) => ({
            teacherId: teacher.id,
            teacherCode: teacher.teacherCode,
            teacherLabel: `${teacher.teacherCode} - ${teacher.specialization}`,
            status: 'present',
            checkInTime: '08:00:00',
            observations: '',
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

  setStatus(teacherId: string, status: TeacherAttendanceStatus): void {
    this.rows.update((current) =>
      current.map((row) => (row.teacherId === teacherId ? { ...row, status } : row)),
    );
  }

  updateCheckInTime(teacherId: string, value: unknown): void {
    const parsed = String(value ?? '').trim();
    this.rows.update((current) =>
      current.map((row) => (row.teacherId === teacherId ? { ...row, checkInTime: parsed } : row)),
    );
  }

  updateObservations(teacherId: string, value: unknown): void {
    const parsed = String(value ?? '').trim();
    this.rows.update((current) =>
      current.map((row) => (row.teacherId === teacherId ? { ...row, observations: parsed } : row)),
    );
  }

  saveManual(): void {
    this.saving.set(true);
    this.teacherAttendanceApi
      .registerBulk({
        date: this.attendanceDate(),
        attendances: this.rows().map((row) => ({
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
            if (!existing) return row;
            return {
              ...row,
              status: existing.status ?? row.status,
              checkInTime: this.normalizeTime(existing.checkInTime ?? row.checkInTime),
              observations: existing.observations ?? row.observations,
            };
          }),
        );
      },
    });
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
}
