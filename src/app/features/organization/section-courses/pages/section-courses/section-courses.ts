import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { SectionCourseStore } from '../../services/store/section-course.store';
import type { SectionCourse } from '../../types/section-course-types';
import { SectionCourseForm } from '../../components/section-course-form/section-course-form';
import { CommonModule } from '@angular/common';
import { SectionCourseCardComponent } from '../../components/section-course-card/section-course-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';

@Component({
  selector: 'sga-section-courses',
  standalone: true,
  imports: [CommonModule, HeaderDetail, SectionCourseCardComponent, EmptyState, Skeleton],
  templateUrl: './section-courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionCoursesPage {
  private dialog = inject(Dialog);
  private store = inject(SectionCourseStore);

  readonly skeletonItems = [1, 2, 3, 4];

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll({});
  }

  editSectionCourse(sc: SectionCourse) {
    this.openForm(sc);
  }

  deleteSectionCourse(sc: SectionCourse) {
    const label = sc.course?.name && sc.section?.name ? `${sc.course.name} - ${sc.section.name}` : sc.id;
    if (confirm(`¿Eliminar la asignación "${label}"?`)) {
      this.store.delete(sc.id).subscribe({
        next: () => this.onRefresh(),
      });
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: SectionCourse | null) {
    const ref = this.dialog.open(SectionCourseForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
