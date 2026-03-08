import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListToolbar } from '@shared/ui/list-toolbar';
import { DataSource, SgaTemplate } from '@shared/components/data-source/data-source';
import { AttendanceStore } from '../../../academic-setting/attendances/services/store/attendance.store';
import { DataSourceColumn } from '@core/types/data-source-types';

@Component({
  selector: 'sga-attendance-reports',
  standalone: true,
  imports: [CommonModule, ListToolbar, DataSource, SgaTemplate],
  templateUrl: './attendance-reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceReportsPage implements OnInit {
  public readonly store = inject(AttendanceStore);

  columns: DataSourceColumn[] = [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'studentName', label: 'Estudiante', sortable: true },
    { key: 'status', label: 'Estado', sortable: true, type: 'custom', customTemplate: 'statusTemplate' },
    { key: 'sessionType', label: 'Sesión' },
  ];

  data = computed(() => this.store.attendances());
  loading = computed(() => this.store.loading());

  ngOnInit(): void {
    this.onRefresh();
  }

  onRefresh() {
    this.store.loadByFilter({});
  }

  onSearch() {
    // Implementar búsqueda si el store lo soporta
  }
}
