import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Competency } from '../../types/competency-types';


@Component({
  selector: 'sga-competency-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardButtonComponent],
  templateUrl: './competency-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyCardComponent {
  competency = input.required<Competency>();
  edit = output<Competency>();
  delete = output<Competency>();
}
