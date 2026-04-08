import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherScheduleComplianceStatus,
  TeacherScheduleMonitoringRow,
} from '@features/teachers/types/teacher-attendance-types';

type MonitoringDialogData = {
  row: TeacherScheduleMonitoringRow;
};

type Option = { value: TeacherScheduleComplianceStatus; label: string };

@Component({
  selector: 'sga-teacher-schedule-monitoring-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './teacher-schedule-monitoring-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherScheduleMonitoringForm {
  private readonly data = inject(Z_MODAL_DATA) as MonitoringDialogData;
  private readonly ref = inject(ZardDialogRef<boolean>);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TeacherAttendanceApi);
  private readonly toast = inject(Toast);

  readonly row = this.data.row;
  readonly loading = computed(() => this.form.disabled);

  readonly statusOptions: Option[] = [
    { value: 'fulfilled', label: 'Cumple' },
    { value: 'partial', label: 'Parcial' },
    { value: 'unfulfilled', label: 'No cumple' },
    { value: 'reprogrammed', label: 'Reprogramado' },
    { value: 'pending', label: 'Pendiente' },
  ];

  readonly form = this.fb.group({
    actualStartTime: [this.toInputTime(this.row.actualStartTime), Validators.required],
    actualEndTime: [this.toInputTime(this.row.actualEndTime), Validators.required],
    complianceStatus: [this.row.complianceStatus, Validators.required],
    justification: [this.row.justification ?? ''],
  });

  readonly percentage = computed(() => {
    const start = this.normalizeTime(this.form.controls.actualStartTime.value);
    const end = this.normalizeTime(this.form.controls.actualEndTime.value);
    const plannedMinutes = this.row.plannedMinutes;
    if (!start || !end || plannedMinutes <= 0) return '0.0%';
    const actualMinutes = Math.max(0, this.toMinutes(end) - this.toMinutes(start));
    const value = Math.min(100, Math.round((actualMinutes / plannedMinutes) * 10000) / 100);
    return `${value.toFixed(1)}%`;
  });

  submit(): void {
    if (this.form.invalid || this.form.disabled) return;

    const actualStartTime = this.normalizeTime(this.form.controls.actualStartTime.value);
    const actualEndTime = this.normalizeTime(this.form.controls.actualEndTime.value);
    const complianceStatus = this.form.controls.complianceStatus.value;
    const justification = (this.form.controls.justification.value ?? '').trim();

    if (!actualStartTime || !actualEndTime || !complianceStatus) {
      this.toast.error('Completa los campos requeridos para registrar el bloque.');
      return;
    }

    this.form.disable();
    this.api
      .registerBulk({
        date: this.row.date,
        attendances: [
          {
            teacherId: this.row.teacherId ?? undefined,
            scheduleId: this.row.scheduleId,
            sectionCourseId: this.row.sectionCourseId ?? undefined,
            status: this.mapAttendanceStatus(complianceStatus),
            complianceStatus,
            checkInTime: actualStartTime,
            checkOutTime: actualEndTime,
            plannedStartTime: this.row.plannedStartTime ?? undefined,
            plannedEndTime: this.row.plannedEndTime ?? undefined,
            justification: justification || undefined,
          },
        ],
      })
      .subscribe({
        next: (response) => {
          this.form.enable();
          if (response.success) {
            this.toast.success('Seguimiento registrado correctamente.');
            this.ref.close(true);
            return;
          }
          this.toast.error(response.message);
        },
        error: (error) => {
          this.form.enable();
          this.toast.error(error?.error?.message ?? error?.message ?? 'No se pudo guardar el bloque');
        },
      });
  }

  close(): void {
    this.ref.close(false);
  }

  private toInputTime(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '';
  }

  private normalizeTime(value: unknown): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
    if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
    return null;
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  private mapAttendanceStatus(status: TeacherScheduleComplianceStatus) {
    if (status === 'fulfilled') return 'present' as const;
    if (status === 'partial') return 'late' as const;
    if (status === 'unfulfilled') return 'absent' as const;
    if (status === 'reprogrammed') return 'excused' as const;
    return 'present' as const;
  }
}
