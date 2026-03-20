import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentStore } from '../../services/store/assessment.store';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';
import { AssessmentCardComponent } from '../../components/assessment-card/assessment-card';
import { Router } from '@angular/router';
import type { Assessment } from '../../types/assessment-types';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';

@Component({
  selector: 'sga-assessments',
  standalone: true,
  imports: [CommonModule, ListToolbarComponent, ZardButtonComponent, AssessmentCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './assessments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assessments implements OnInit {
  private readonly store = inject(AssessmentStore);
  private readonly filters = inject(AssessmentFiltersService);
  private readonly router = inject(Router);

  data = computed(() =>
    this.store.assessments().filter((assessment) => {
      const search = this.filters.listSearch().trim().toLowerCase();
      if (!search) return true;
      return [
        assessment.name,
        assessment.status,
        assessment.type,
        assessment.period?.name,
        assessment.sectionCourse?.course?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    }),
  );
  loading = computed(() => this.store.loading());
  totalAssessments = computed(() => this.data().length);
  hasListSearch = computed(() => Boolean(this.filters.listSearch()));
  completedCount = computed(() => this.data().filter((item) => item.status === 'completed').length);
  pendingCount = computed(() => this.data().filter((item) => item.status === 'pending').length);
  reviewedCount = computed(() => this.data().filter((item) => item.status === 'reviewed').length);

  ngOnInit() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onSearch(value: string): void {
    this.filters.setListSearch(value);
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onCreate(): void {
    // Placeholder para próxima implementación de modal/formulario
  }

  clearFilters(): void {
    this.filters.clearListFilters();
    this.store.loadAll({});
  }

  onRefresh() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  viewDetail(assessment: Assessment): void {
    this.router.navigate(['/assessments', assessment.id], {
      state: { assessment },
    });
  }

  viewScores(assessment: Assessment): void {
    this.router.navigate(['/assessments/scores'], {
      queryParams: { sectionCourse: assessment.sectionCourse.id },
    });
  }

  viewGrades(assessment: Assessment): void {
    this.router.navigate(['/assessments/grades'], {
      queryParams: { assessmentId: assessment.id },
    });
  }
}
