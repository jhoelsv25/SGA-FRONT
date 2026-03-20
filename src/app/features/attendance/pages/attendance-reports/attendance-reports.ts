import { ChangeDetectionStrategy, Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { AttendanceStore } from '../../../attendances/services/store/attendance.store';
import { UiFiltersService } from '@core/services/ui-filters.service';
import { AttendanceReportCardComponent } from '../../components/attendance-report-card/attendance-report-card';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';


@Component({
  selector: 'sga-attendance-reports',
  standalone: true,
  imports: [CommonModule, HeaderDetail, ZardInputDirective, ZardEmptyComponent, ZardSkeletonComponent, AttendanceReportCardComponent],
  templateUrl: './attendance-reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceReportsPage implements OnInit {
  public readonly store = inject(AttendanceStore);
  private readonly filters = inject(UiFiltersService);
  readonly searchTerm = signal('');
  readonly headerConfig = signal<HeaderConfig>({
    title: 'Reportes de Asistencia',
    subtitle: 'Historial operativo y seguimiento de asistencia estudiantil',
    showActions: true,
    showFilters: false,
  });
  readonly headerActions = signal<ActionConfig[]>([
    { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
  ]);

  data = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.store.attendances();

    if (!term) return rows;

    return rows.filter((row) => {
      const student = (row as { studentName?: string }).studentName?.toLowerCase() ?? '';
      const status = (row.status ?? '').toLowerCase();
      const sessionType = (row.sessionType ?? '').toLowerCase();
      return student.includes(term) || status.includes(term) || sessionType.includes(term);
    });
  });
  loading = computed(() => this.store.loading());
  presentCount = computed(() => this.data().filter((row) => row.status === 'present').length);
  lateCount = computed(() => this.data().filter((row) => row.status === 'late').length);
  absentCount = computed(() => this.data().filter((row) => row.status === 'absent').length);
  excusedCount = computed(() => this.data().filter((row) => row.status === 'excused').length);

  ngOnInit(): void {
    this.searchTerm.set(this.filters.attendanceReportsSearch());
    this.onRefresh();
  }

  onHeaderAction(event: { action: { key: string } }): void {
    if (event.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadByFilter({});
  }

  onSearch(value: string) {
    const next = value ?? '';
    this.searchTerm.set(next);
    this.filters.setAttendanceReportsSearch(next);
  }

  hasSearch = computed(() => Boolean(this.searchTerm().trim()));

  clearFilters(): void {
    this.filters.clearAttendanceReportsFilters();
    this.searchTerm.set('');
  }
}
