import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionCourseApi } from '../../services/section-course-api';
import type { SectionCourse } from '../../services/section-course-api';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderConfig } from '@core/types/header-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import type { ActionConfig, ActionContext } from '@core/types/action-types';

const SECTION_COURSES_HEADER: HeaderConfig = {
  title: 'Cursos por Sección',
  subtitle: 'Asignación de cursos a secciones',
  showActions: true,
  showFilters: true,
};

const COLUMNS: DataSourceColumn[] = [
  { key: 'sectionName', label: 'Sección', sortable: true },
  { key: 'courseName', label: 'Curso', sortable: true },
];

const HEADER_ACTIONS: ActionConfig[] = [
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
];

@Component({
  selector: 'sga-section-courses',
  standalone: true,
  imports: [CommonModule, HeaderDetail, DataSource],
  templateUrl: './section-courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionCoursesPage implements OnInit {
  private readonly api = inject(SectionCourseApi);

  headerConfig = computed(() => SECTION_COURSES_HEADER);
  columns = computed(() => COLUMNS);
  loading = signal(true);
  data = signal<{ id: string; sectionName: string; courseName: string }[]>([]);
  pagination = computed(() => ({
    page: 1,
    size: 10,
    total: this.data().length,
  }));

  headerActions = computed(() => HEADER_ACTIONS);
  rowActions = computed(() => []);

  ngOnInit(): void {
    this.load();
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }): void {
    if (e.action.key === 'refresh') this.load();
  }

  onPageChange(_p: { page: number; size: number }): void {}

  private load(): void {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (list) => {
        const rows = (Array.isArray(list) ? list : []).map((sc: SectionCourse) => ({
          id: sc.id,
          sectionName: sc.section?.name ?? '',
          courseName: sc.course?.name ?? '',
        }));
        this.data.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
