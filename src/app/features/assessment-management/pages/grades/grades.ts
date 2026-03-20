import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentStore } from '../../services/store/assessment.store';
import { type Assessment, type AssessmentScore } from '../../types/assessment-types';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';
import { ActivatedRoute, Router } from '@angular/router';

type ScoreRow = Pick<AssessmentScore, 'enrollmentId' | 'score' | 'observation'> & { studentName: string };

@Component({
  selector: 'sga-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOptionComponent, ListToolbarComponent, ZardButtonComponent],
  templateUrl: './grades.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades implements OnInit {
  public readonly assessmentStore = inject(AssessmentStore);
  private readonly filters = inject(AssessmentFiltersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public selectedAssessmentId = signal<string>('');
  public localScores = signal<ScoreRow[]>([]);
  public assessmentOptions = signal<SelectOption[]>([]);
  public hasActiveFilters = signal(false);
  public enrollmentContextId = signal('');
  public studentContextName = signal('');
  public visibleScores = computed(() =>
    this.localScores().filter((score) => !this.enrollmentContextId() || score.enrollmentId === this.enrollmentContextId()),
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.enrollmentContextId.set(params.get('enrollmentId') ?? '');
      this.studentContextName.set(params.get('studentName') ?? '');
    });
    this.assessmentStore.loadAll({});
  }

  constructor() {
    effect(() => {
      const assessments = this.assessmentStore.assessments();
      this.assessmentOptions.set([
        { value: '', label: 'Seleccione una evaluación...' },
        ...assessments.map((a: Assessment) => ({
          value: a.id,
          label: `${a.name} - ${a.sectionCourse?.course?.name ?? ''} (${a.sectionCourse?.id ?? ''})`,
        }))]);

      const options = this.assessmentOptions().filter((o) => o.value);
      if (options.length === 0) return;

      const saved = this.filters.gradesAssessmentId();
      const fallback = options[0]?.value?.toString() ?? '';
      const next = (saved && options.some((o) => o.value?.toString() === saved)) ? saved : fallback;

      if (next && next !== this.selectedAssessmentId()) {
        this.onAssessmentChange(next);
      }
    });
    effect(() => {
      const scores = this.assessmentStore.activeScores();
      const id = this.selectedAssessmentId();
      if (id && scores.length > 0) {
        this.syncScoresFromStore(scores);
      }
    });
  }

  onAssessmentChange(value: unknown): void {
    const id = value === null || value === undefined ? '' : String(value);
    this.selectedAssessmentId.set(id);
    this.hasActiveFilters.set(Boolean(id));
    this.filters.setGradesAssessmentId(id);
    this.localScores.set([]);
    if (id) {
      this.assessmentStore.loadScores(id);
    }
  }

  syncScoresFromStore(scores: AssessmentScore[]) {
    this.localScores.set(scores.map(s => ({
      enrollmentId: s.enrollmentId,
      studentName: s.studentName ?? '',
      score: s.score,
      observation: s.observation ?? ''
    })));
  }

  saveGrades() {
    const request = {
      assessmentId: this.selectedAssessmentId(),
      scores: this.localScores().map(s => ({
        enrollmentId: s.enrollmentId,
        score: s.score,
        observation: s.observation
      }))
    };
    
    this.assessmentStore.saveScores(request).subscribe();
  }

  updateScore(enrollmentId: string, score: number) {
    this.localScores.update(prev => 
      prev.map(s => s.enrollmentId === enrollmentId ? { ...s, score } : s)
    );
  }

  updateObservation(enrollmentId: string, observation: string) {
    this.localScores.update(prev => 
      prev.map(s => s.enrollmentId === enrollmentId ? { ...s, observation } : s)
    );
  }

  getSelectedAssessmentLabel(): string {
    const selected = this.selectedAssessmentId();
    return this.assessmentOptions().find((o) => String(o.value ?? '') === selected)?.label ?? '';
  }

  clearFilters(): void {
    this.filters.clearGradesFilters();
    this.selectedAssessmentId.set('');
    this.hasActiveFilters.set(false);
    this.localScores.set([]);
  }

  clearEnrollmentContext(): void {
    this.router.navigate(['/assessments/grades'], {
      queryParams: {
        enrollmentId: null,
        studentName: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
