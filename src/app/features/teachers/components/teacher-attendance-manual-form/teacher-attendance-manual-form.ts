import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import { TeacherAttendanceStatus } from '@features/teachers/types/teacher-attendance-types';
import { Button } from '@shared/directives';
import { Input } from '@shared/adapters/ui/input/input';
import { Select, SelectOption } from '@shared/adapters/ui/select/select';

interface ManualAttendanceDialogData {
  date: string;
  teachers: { id: string; teacherCode: string; specialization: string }[];
}

@Component({
  selector: 'sga-teacher-attendance-manual-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input, Select],
  templateUrl: './teacher-attendance-manual-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAttendanceManualForm {
  private readonly data = inject(Z_MODAL_DATA) as ManualAttendanceDialogData;
  private readonly ref = inject(ZardDialogRef<boolean>);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TeacherAttendanceApi);
  private readonly toast = inject(Toast);

  loading = false;

  teacherOptions: SelectOption[] = [
    { value: '', label: 'Seleccione docente...' },
    ...this.data.teachers.map((t) => ({
      value: t.id,
      label: `${t.teacherCode} - ${t.specialization}`,
    })),
  ];

  statusOptions: SelectOption[] = [
    { value: 'present' satisfies TeacherAttendanceStatus, label: 'Presente' },
    { value: 'late' satisfies TeacherAttendanceStatus, label: 'Tardanza' },
    { value: 'absent' satisfies TeacherAttendanceStatus, label: 'Falta' },
    { value: 'excused' satisfies TeacherAttendanceStatus, label: 'Justificado' },
  ];

  form = this.fb.group({
    teacherId: ['', [Validators.required]],
    status: ['present' as TeacherAttendanceStatus, [Validators.required]],
    checkInTime: ['08:00', [Validators.required]],
    observations: [''],
  });

  private normalizeTime(value: string): string {
    const raw = String(value ?? '').trim();
    if (!raw) return '08:00:00';
    if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
    if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
    return '08:00:00';
  }

  onTeacherChange(value: unknown): void {
    this.form.controls.teacherId.setValue(value == null ? '' : `${value}`);
  }

  onStatusChange(value: unknown): void {
    const v = value == null ? 'present' : `${value}`;
    if (v === 'present' || v === 'late' || v === 'absent' || v === 'excused') {
      this.form.controls.status.setValue(v);
      return;
    }
    this.form.controls.status.setValue('present');
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;

    const teacherId = this.form.controls.teacherId.value ?? '';
    const teacher = this.data.teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      this.toast.error('Docente no encontrado.');
      return;
    }

    const status = (this.form.controls.status.value ?? 'present') as TeacherAttendanceStatus;
    const checkInTime = this.normalizeTime(this.form.controls.checkInTime.value ?? '08:00');
    const observations = (this.form.controls.observations.value ?? '').trim();

    this.loading = true;
    this.api
      .registerBulk({
        date: this.data.date,
        attendances: [
          {
            teacherCode: teacher.teacherCode,
            status,
            checkInTime,
            observations: observations || undefined,
          },
        ],
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toast.success('Asistencia registrada correctamente.');
            this.ref.close(true);
          } else {
            this.toast.error(res.message);
          }
        },
        error: (error) => {
          this.loading = false;
          this.toast.error(error?.error?.message ?? error?.message ?? 'No se pudo registrar asistencia');
        },
      });
  }

  close(): void {
    this.ref.close(false);
  }
}
