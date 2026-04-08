import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherScheduleComplianceStatus,
  TeacherScheduleMonitoringRow,
} from '@features/teachers/types/teacher-attendance-types';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { TeacherScheduleMonitoringForm } from '@features/teachers/components/teacher-schedule-monitoring-form/teacher-schedule-monitoring-form';

type MonitoringRow = TeacherScheduleMonitoringRow & {
  dirty?: boolean;
};

@Component({
  selector: 'sga-teacher-attendances',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardInputDirective, ZardButtonComponent],
  templateUrl: './teacher-attendances.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherAttendancesPage implements OnInit {
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly toast = inject(Toast);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogModalService);

  readonly attendanceDate = signal(new Date().toISOString().slice(0, 10));
  readonly teacherContextId = signal('');
  readonly teacherContextName = signal('');
  readonly rows = signal<MonitoringRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly fulfilledCount = computed(
    () => this.rows().filter((row) => row.complianceStatus === 'fulfilled').length,
  );
  readonly partialCount = computed(
    () => this.rows().filter((row) => row.complianceStatus === 'partial').length,
  );
  readonly unfulfilledCount = computed(
    () => this.rows().filter((row) => row.complianceStatus === 'unfulfilled').length,
  );
  readonly reprogrammedCount = computed(
    () => this.rows().filter((row) => row.complianceStatus === 'reprogrammed').length,
  );
  readonly pendingCount = computed(
    () => this.rows().filter((row) => row.complianceStatus === 'pending').length,
  );
  readonly dirtyCount = computed(() => this.rows().filter((row) => !!row.dirty).length);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.teacherContextId.set(params.get('teacherId') ?? '');
      this.teacherContextName.set(params.get('teacherName') ?? '');
      this.loadMonitoring();
    });
  }

  onDateChange(value: unknown): void {
    this.attendanceDate.set(String(value ?? '').slice(0, 10));
    this.loadMonitoring();
  }

  loadMonitoring(): void {
    this.loading.set(true);
    this.teacherAttendanceApi
      .getScheduleMonitoring({
        date: this.attendanceDate(),
        ...(this.teacherContextId() ? { teacherId: this.teacherContextId() } : {}),
      })
      .subscribe({
        next: (response) => {
          this.rows.set((response.data ?? []).map((row) => ({ ...row, dirty: false })));
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.toast.error(error?.error?.message ?? error?.message ?? 'No se pudo cargar el seguimiento');
        },
      });
  }

  openRegisterModal(row: MonitoringRow): void {
    this.dialog
      .open(TeacherScheduleMonitoringForm, {
        data: { row },
        width: '720px',
        maxHeight: '85vh',
      })
      .closed.subscribe((saved) => {
        if (saved) {
          this.loadMonitoring();
        }
      });
  }

  clearTeacherContext(): void {
    this.router.navigate(['/teachers/attendances']);
  }

  formatPlannedRange(row: MonitoringRow): string {
    return `${this.formatTime(row.plannedStartTime)} - ${this.formatTime(row.plannedEndTime)}`;
  }

  formatTime(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '--:--';
  }

  percentageLabel(value: number): string {
    return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
  }

  statusLabel(status: TeacherScheduleComplianceStatus): string {
    if (status === 'fulfilled') return 'Cumple';
    if (status === 'partial') return 'Parcial';
    if (status === 'unfulfilled') return 'No cumple';
    if (status === 'reprogrammed') return 'Reprogramado';
    return 'Pendiente';
  }

  statusClass(status: TeacherScheduleComplianceStatus): string {
    if (status === 'fulfilled') return 'border-success/20 bg-success/10 text-success-700 dark:text-success';
    if (status === 'partial') return 'border-warning/20 bg-warning/10 text-warning-700 dark:text-warning';
    if (status === 'unfulfilled') return 'border-danger/20 bg-danger/10 text-danger-700 dark:text-danger';
    if (status === 'reprogrammed') return 'border-info/20 bg-info/10 text-info';
    return 'border-base-200 bg-base-200/70 text-base-content/60';
  }
}
