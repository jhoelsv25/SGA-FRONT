import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import type { Assessment } from '../../types/assessment-types';

@Component({
  selector: 'sga-assessment-card',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverComponent,
    ZardPopoverDirective,
  ],
  templateUrl: './assessment-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentCardComponent {
  assessment = input.required<Assessment>();

  viewDetail = output<Assessment>();
  viewScores = output<Assessment>();
  viewGrades = output<Assessment>();
  edit = output<Assessment>();
  remove = output<Assessment>();

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      formative: 'Formativa',
      summative: 'Sumativa',
      diagnostic: 'Diagnóstica',
    };
    return map[this.assessment().type] ?? this.assessment().type;
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      completed: 'Completada',
      reviewed: 'Revisada',
    };
    return map[this.assessment().status] ?? this.assessment().status;
  });

  readonly statusClass = computed(() => {
    const map: Record<string, string> = {
      pending: 'border-warning/30 bg-warning/10 text-warning-700 dark:text-warning',
      completed: 'border-success/30 bg-success/10 text-success-700 dark:text-success',
      reviewed: 'border-primary/30 bg-primary/10 text-primary',
    };
    return map[this.assessment().status] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });
}
