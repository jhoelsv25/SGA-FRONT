import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataSource, SgaTemplate } from '@shared/widgets/data-source/data-source';
import { AttendanceStore } from '../../../academic-setting/attendances/services/store/attendance.store';
import { DataSourceColumn } from '@core/types/data-source-types';
import { UiFiltersService } from '@core/services/ui-filters.service';


@Component({
  selector: 'sga-attendance-reports',
  standalone: true,
  imports: [CommonModule, ListToolbarComponent, DataSource, SgaTemplate, ZardButtonComponent],
  templateUrl: './attendance-reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceReportsPage implements OnInit {
  public readonly store = inject(AttendanceStore);
  private readonly filters = inject(UiFiltersService);
  private readonly searchTerm = signal('');

  columns: DataSourceColumn[] = [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'studentName', label: 'Estudiante', sortable: true },
    { key: 'status', label: 'Estado', sortable: true, type: 'custom', customTemplate: 'statusTemplate' },
    { key: 'sessionType', label: 'Sesión' }];

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

  ngOnInit(): void {
    this.searchTerm.set(this.filters.attendanceReportsSearch());
    this.onRefresh();
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
