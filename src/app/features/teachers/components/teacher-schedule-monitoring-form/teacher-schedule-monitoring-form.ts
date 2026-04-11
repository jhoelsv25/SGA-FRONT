import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherAttendanceInterval,
  TeacherScheduleComplianceStatus,
  TeacherScheduleMonitoringRow,
} from '@features/teachers/types/teacher-attendance-types';

type MonitoringDialogData = {
  row: TeacherScheduleMonitoringRow;
};

type Option = { value: TeacherScheduleComplianceStatus; label: string };

@Component({
  selector: 'sga-teacher-schedule-monitoring-form',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
  ],
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
    complianceStatus: [this.row.complianceStatus, Validators.required],
    justification: [this.row.justification ?? ''],
    learningPurpose: [this.row.learningPurpose ?? ''],
    downTimeReason: [this.row.downTimeReason ?? ''],
    intervals: this.fb.array(this.createInitialIntervals()),
  });

  get intervals(): FormArray {
    return this.form.controls.intervals as FormArray;
  }

  readonly percentage = computed(() => {
    const plannedMinutes = this.row.plannedMinutes;
    if (plannedMinutes <= 0) return '0.0%';
    const actualMinutes = this.actualMinutes();
    const value = Math.min(100, Math.round((actualMinutes / plannedMinutes) * 10000) / 100);
    return `${value.toFixed(1)}%`;
  });

  readonly actualMinutes = computed(() => {
    return this.readIntervals().reduce((total, interval) => {
      if (!interval.startTime || !interval.endTime) return total;
      return (
        total + Math.max(0, this.toMinutes(interval.endTime) - this.toMinutes(interval.startTime))
      );
    }, 0);
  });

  readonly downTimeMinutes = computed(() => {
    const intervals = this.readIntervals();
    let total = 0;
    for (let index = 0; index < intervals.length - 1; index++) {
      const current = intervals[index];
      const next = intervals[index + 1];
      if (!current.endTime || !next.startTime) continue;
      total += Math.max(0, this.toMinutes(next.startTime) - this.toMinutes(current.endTime));
    }
    return total;
  });

  submit(): void {
    if (this.form.invalid || this.form.disabled) return;

    const intervals = this.readIntervals();
    const actualStartTime = intervals[0]?.startTime ?? null;
    const actualEndTime = this.getLastEndedInterval(intervals)?.endTime ?? null;
    const complianceStatus = this.form.controls.complianceStatus.value;
    const justification = (this.form.controls.justification.value ?? '').trim();

    if (
      !actualStartTime ||
      !actualEndTime ||
      !complianceStatus ||
      intervals.some((interval) => !interval.startTime || !interval.endTime)
    ) {
      this.toast.error(
        'Completa todos los tramos con hora de inicio y fin para registrar el bloque.',
      );
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
            learningPurpose: (this.form.controls.learningPurpose.value ?? '').trim() || undefined,
            downTimeMinutes: this.downTimeMinutes(),
            downTimeReason: (this.form.controls.downTimeReason.value ?? '').trim() || undefined,
            intervals,
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
          this.toast.error(
            error?.error?.message ?? error?.message ?? 'No se pudo guardar el bloque',
          );
        },
      });
  }

  close(): void {
    this.ref.close(false);
  }

  addInterval(): void {
    const last = this.readIntervals().at(-1);
    this.intervals.push(
      this.createIntervalGroup({
        startTime: last?.endTime ?? this.toInputTime(this.row.plannedStartTime),
        endTime: this.toInputTime(this.row.plannedEndTime),
        intervalType: 'class',
        reason: '',
      }),
    );
  }

  removeInterval(index: number): void {
    if (this.intervals.length <= 1) return;
    this.intervals.removeAt(index);
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

  private createInitialIntervals() {
    const intervals = this.row.intervals?.length
      ? this.row.intervals
      : [
          {
            startTime: this.toInputTime(this.row.actualStartTime ?? this.row.plannedStartTime),
            endTime: this.toInputTime(this.row.actualEndTime ?? this.row.plannedEndTime),
            intervalType: 'class',
            reason: '',
          },
        ];

    return intervals.map((interval) => this.createIntervalGroup(interval));
  }

  private createIntervalGroup(interval?: Partial<TeacherAttendanceInterval>) {
    return this.fb.group({
      startTime: [this.toInputTime(interval?.startTime ?? ''), Validators.required],
      endTime: [this.toInputTime(interval?.endTime ?? ''), Validators.required],
      intervalType: [interval?.intervalType ?? 'class'],
      reason: [interval?.reason ?? ''],
      latitude: [interval?.latitude ?? null],
      longitude: [interval?.longitude ?? null],
      isWithinGeofence: [interval?.isWithinGeofence ?? true],
    });
  }

  private readIntervals(): TeacherAttendanceInterval[] {
    return this.intervals.controls
      .map((control) => {
        const raw = control.getRawValue();
        return {
          startTime: this.normalizeTime(raw.startTime) ?? '',
          endTime: this.normalizeTime(raw.endTime),
          intervalType: String(raw.intervalType ?? 'class').trim() || 'class',
          reason: String(raw.reason ?? '').trim() || undefined,
          latitude: raw.latitude ?? undefined,
          longitude: raw.longitude ?? undefined,
          isWithinGeofence: raw.isWithinGeofence ?? undefined,
        } satisfies TeacherAttendanceInterval;
      })
      .sort((a, b) => this.toMinutes(a.startTime) - this.toMinutes(b.startTime));
  }

  private getLastEndedInterval(intervals: TeacherAttendanceInterval[]) {
    for (let index = intervals.length - 1; index >= 0; index--) {
      if (intervals[index]?.endTime) {
        return intervals[index];
      }
    }
    return null;
  }

  private mapAttendanceStatus(status: TeacherScheduleComplianceStatus) {
    if (status === 'fulfilled') return 'present' as const;
    if (status === 'partial') return 'late' as const;
    if (status === 'unfulfilled') return 'absent' as const;
    if (status === 'reprogrammed') return 'excused' as const;
    return 'present' as const;
  }
}
