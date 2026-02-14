import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from '@shared/ui/select/select';
import type { SelectOption } from '@shared/ui/select/select';
import { AssessmentStore } from '../../services/store/assessment.store';
import { type Assessment, type AssessmentScore } from '../../types/assessment-types';

type ScoreRow = Pick<AssessmentScore, 'enrollmentId' | 'score' | 'observation'> & { studentName: string };

@Component({
  selector: 'sga-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, Select],
  templateUrl: './grades.html',
  styleUrl: './grades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades implements OnInit {
  public readonly assessmentStore = inject(AssessmentStore);

  public selectedAssessmentId = signal<string>('');
  public localScores = signal<ScoreRow[]>([]);
  public assessmentOptions = signal<SelectOption[]>([]);

  ngOnInit(): void {
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
        })),
      ]);
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
}
