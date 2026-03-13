import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/adapters/ui/card/card';
import { Button } from '@shared/directives';
import { GradeLevel } from '../../types/grade-level-types';

@Component({
  selector: 'sga-grade-level-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './grade-level-card.html',
  styleUrls: ['./grade-level-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLevelCardComponent {
  gradeLevel = input.required<GradeLevel>();
  edit = output<GradeLevel>();
  delete = output<GradeLevel>();
  viewSections = output<GradeLevel>();

  getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      'primary': 'Primaria',
      'secondary': 'Secundaria',
      'higher': 'Superior'
    };
    return labels[level] || level;
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'primary': 'bg-info/10 text-info border-info/20',
      'secondary': 'bg-success/10 text-success border-success/20',
      'higher': 'bg-warning/10 text-warning border-warning/20'
    };
    return colors[level] || 'bg-base-200 text-base-content/60';
  }
}
