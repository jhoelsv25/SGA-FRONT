import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Toast } from '@core/services/toast';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'sga-teacher-daily-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardDatePickerComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardIconComponent
  ],
  templateUrl: './teacher-daily-monitoring.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherDailyMonitoringPage implements OnInit {
  private readonly api = inject(TeacherAttendanceApi);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly date = signal(this.getTodayLocalDate());
  readonly dateValue = computed(() => this.parseDateInput(this.date()));
  readonly rows = signal<any[]>([]);
  readonly loading = signal(false);

  readonly presentCount = computed(() => this.rows().filter(r => r.clockInTime).length);
  readonly outOfRangeCount = computed(() => this.rows().filter(r => r.clockInTime && !r.isWithinGeofence).length);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const queryDate = params.get('date');
      if (!queryDate) {
        this.syncDateParam(this.getTodayLocalDate(), true);
        return;
      }

      this.date.set(queryDate);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.getAllDaily({ date: this.date() }).subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Error al cargar asistencia diaria', { description: err.message });
      }
    });
  }

  onDateChange(value: unknown): void {
    const normalized = value instanceof Date ? this.formatDateInput(value) : String(value ?? '').slice(0, 10);
    this.syncDateParam(normalized);
  }

  viewTeacher(teacherId: string): void {
    this.router.navigate(['/teachers', teacherId]);
  }

  private parseDateInput(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private formatDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayLocalDate(): string {
    return this.formatDateInput(new Date());
  }

  private syncDateParam(date: string, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
