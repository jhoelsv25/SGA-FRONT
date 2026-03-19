import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradeLevel } from '../../types/grade-level-types';

@Component({
  selector: 'sga-grade-level-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './grade-level-card.html',
  styleUrls: ['./grade-level-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLevelCardComponent {
  gradeLevel = input.required<GradeLevel>();
  edit = output<GradeLevel>();
  delete = output<GradeLevel>();
  viewSections = output<GradeLevel>();
  viewCourses = output<GradeLevel>();

  getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      primary: 'Primaria',
      secondary: 'Secundaria',
      higher: 'Superior',
    };
    return labels[level] || level;
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      primary: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      secondary: 'bg-green-500/10 text-green-500 border-green-500/20',
      higher: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
    return colors[level] || 'bg-muted text-muted-foreground border-border';
  }
}
