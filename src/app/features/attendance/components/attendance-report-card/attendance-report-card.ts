import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import type { Attendance } from '../../../attendances/types/attendance-types';

@Component({
  selector: 'sga-attendance-report-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardIconComponent],
  templateUrl: './attendance-report-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceReportCardComponent {
  attendance = input.required<Attendance>();

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      present: 'Presente',
      late: 'Tardanza',
      absent: 'Falta',
      excused: 'Justificado',
    };
    return map[this.attendance().status] ?? this.attendance().status;
  });

  readonly statusClass = computed(() => {
    const map: Record<string, string> = {
      present: 'border-success/30 bg-success/10 text-success-700 dark:text-success',
      late: 'border-warning/30 bg-warning/10 text-warning-700 dark:text-warning',
      absent: 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger',
      excused: 'border-info/30 bg-info/10 text-info-700 dark:text-info',
    };
    return map[this.attendance().status] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });
}
