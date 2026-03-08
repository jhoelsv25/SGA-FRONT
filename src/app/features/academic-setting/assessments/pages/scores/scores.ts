import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ListToolbar } from '@shared/ui/list-toolbar';
import { DataSource, SgaTemplate } from '@shared/components/data-source/data-source';
import { Input } from '@shared/ui/input/input';
import { Select, type SelectOption } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { Toast } from '@core/services/toast';

import { AssessmentStore } from '../../services/store/assessment.store';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';
import { SectionCourseApi } from '@features/organization/section-courses/services/section-course-api';
import { DataSourceColumn } from '@core/types/data-source-types';

type ScoreRow = { 
  id?: string; 
  enrollmentId: string; 
  studentName: string; 
  studentCode: string; 
  score: number; 
  observation: string 
};

@Component({
  selector: 'sga-assessment-scores',
  standalone: true,
  imports: [CommonModule, FormsModule, ListToolbar, DataSource, SgaTemplate, Input, Select, Button],
  templateUrl: './scores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AssessmentScoresPage implements OnInit {
  public readonly store = inject(AssessmentStore);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly toast = inject(Toast);

  // Filters
  public selectedSectionCourse = signal<string>('');
  public selectedAssessment = signal<string>('');
  
  // Data
  public sectionCourseOptions = signal<SelectOption[]>([]);
  public assessmentOptions = signal<SelectOption[]>([]);
  public studentScores = signal<ScoreRow[]>([]);
  
  public columns: DataSourceColumn[] = [
    { key: 'studentCode', label: 'Código', width: '120px' },
    { key: 'studentName', label: 'Estudiante', sortable: true },
    { key: 'score', label: 'Calificación', width: '150px', type: 'custom', customTemplate: 'scoreTemplate' },
    { key: 'observation', label: 'Observación', type: 'custom', customTemplate: 'observationTemplate' },
  ];

  public canSave = computed(() => this.selectedAssessment() && this.studentScores().length > 0);

  ngOnInit(): void {
    this.loadSectionCourses();
  }

  private loadSectionCourses() {
    this.sectionCourseApi.getAll().subscribe({
      next: (res) => {
        this.sectionCourseOptions.set(
          res.data.map((sc) => ({
            value: sc.id,
            label: `${sc.course?.name || 'CP'} - ${sc.section?.name || 'S'}`,
          }))
        );
      },
    });
  }

  onSectionCourseChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedSectionCourse.set(id);
    this.selectedAssessment.set('');
    this.studentScores.set([]);
    
    if (id) {
      this.loadAssessments(id);
    } else {
      this.assessmentOptions.set([]);
    }
  }

  private loadAssessments(sectionCourseId: string) {
    this.store.loadAll({ sectionCourse: sectionCourseId });
    // Note: In an effect or simple subscribe we would update options. 
    // For simplicity here, we'll use an effect or just signal derived.
  }

  // Derived options from store
  public filteredAssessments = computed(() => {
    return this.store.assessments().map(a => ({
      value: a.id,
      label: `${a.name} (${a.weightPercentage}%)`
    }));
  });

  onAssessmentChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedAssessment.set(id);
    if (id) {
      this.loadData(id);
    } else {
      this.studentScores.set([]);
    }
  }

  private loadData(assessmentId: string) {
    // 1. Get enrollments for the section
    const scId = this.selectedSectionCourse();
    this.enrollmentApi.getAll({ sectionCourse: scId }).subscribe({
      next: (enrollmentRes) => {
        const baseRows: ScoreRow[] = enrollmentRes.data.map(e => ({
          enrollmentId: e.id,
          studentName: `${e.student?.person?.firstName || ''} ${e.student?.person?.lastName || ''}`.trim() || e.student?.studentCode,
          studentCode: e.student?.studentCode,
          score: 0,
          observation: ''
        }));
        this.studentScores.set(baseRows);

        // 2. Get existing scores
        this.store.loadScores(assessmentId);
        // We'll merge them in a separate step or effect
        // For brevity in this mock-up, let's assume we merge manually here if store was synchronous or use a timeout/manual subscribe
      }
    });
  }

  // Merging logic would go here, listening to store.activeScores()
  
  saveScores() {
    if (!this.selectedAssessment()) return;
    
    const request = {
      assessmentId: this.selectedAssessment(),
      scores: this.studentScores().map(s => ({
        enrollmentId: s.enrollmentId,
        score: s.score,
        observation: s.observation
      }))
    };

    this.store.saveScores(request).subscribe();
  }
}
