import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { Toast } from '@core/services/toast';
import { AssessmentApi } from '../../services/assessment-api';
import type { Assessment, AssessmentScore } from '../../types/assessment-types';

@Component({
  selector: 'sga-assessment-detail',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './assessment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentApi = inject(AssessmentApi);
  private readonly toast = inject(Toast);

  readonly assessment = signal<Assessment | null>(
    (history.state?.assessment as Assessment | undefined) ?? null,
  );
  readonly scores = signal<AssessmentScore[]>([]);
  readonly loading = signal(true);

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      formative: 'Formativa',
      summative: 'Sumativa',
      diagnostic: 'Diagnóstica',
    };
    return map[this.assessment()?.type ?? ''] ?? (this.assessment()?.type || 'Sin tipo');
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      completed: 'Completada',
      reviewed: 'Revisada',
    };
    return map[this.assessment()?.status ?? ''] ?? (this.assessment()?.status || 'Sin estado');
  });

  readonly averageScore = computed(() => {
    const list = this.scores();
    if (!list.length) return 0;
    const total = list.reduce((sum, item) => sum + Number(item.score || 0), 0);
    return Number((total / list.length).toFixed(2));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/assessments/list']);
      return;
    }
    this.loadAssessment(id);
  }

  goBack(): void {
    this.router.navigate(['/assessments/list']);
  }

  goToScores(): void {
    const current = this.assessment();
    if (!current) return;
    this.router.navigate(['/assessments/scores'], {
      queryParams: { sectionCourse: current.sectionCourse.id },
    });
  }

  goToGrades(): void {
    const current = this.assessment();
    if (!current) return;
    this.router.navigate(['/assessments/grades'], {
      queryParams: { assessmentId: current.id },
    });
  }

  private loadAssessment(id: string): void {
    this.loading.set(true);
    this.assessmentApi.getById(id).subscribe({
      next: (assessment) => {
        this.assessment.set(assessment);
        this.assessmentApi.getScoresByAssessment(id).subscribe({
          next: (scoresRes) => {
            this.scores.set(scoresRes.data ?? []);
            this.loading.set(false);
          },
          error: () => {
            this.scores.set([]);
            this.loading.set(false);
          },
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar la evaluación', { description: error?.message });
        this.router.navigate(['/assessments/list']);
      },
    });
  }
}
