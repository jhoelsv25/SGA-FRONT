import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { CourseStore } from '../../services/store/course.store';
import type { Course } from '../../types/course-types';
import { CourseForm } from '../../components/course-form/course-form';
import { CommonModule } from '@angular/common';
import { CourseCardComponent } from '../../components/course-card/course-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';

@Component({
  selector: 'sga-courses',
  standalone: true,
  imports: [CommonModule, HeaderDetail, CourseCardComponent, EmptyState, Skeleton, ListToolbar],
  templateUrl: './courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CoursesPage {
  private dialog = inject(Dialog);
  private store = inject(CourseStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  filterType = signal<'mandatory' | 'elective' | ''>('');

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.courses());
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    return list.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (c.code?.toLowerCase().includes(search) ?? false);
      const matchType =
        !type ||
        (type === 'mandatory' && c.isMandatory !== false) ||
        (type === 'elective' && c.isMandatory === false);
      return matchSearch && matchType;
    });
  });

  filterCount = computed(() => (this.filterType() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterType(event: Event) {
    const value = (event.target as HTMLSelectElement).value as '' | 'mandatory' | 'elective';
    this.filterType.set(value);
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll({});
  }

  editCourse(course: Course) {
    this.openForm(course);
  }

  deleteCourse(course: Course) {
    if (confirm(`¿Eliminar el curso "${course.name}"?`)) {
      this.store.delete(course.id);
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: Course | null) {
    const ref = this.dialog.open(CourseForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
