import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/adapters/ui/card/card';
import { Button } from '@shared/directives';
import type { Competency } from '../../types/competency-types';

@Component({
  selector: 'sga-competency-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './competency-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyCardComponent {
  competency = input.required<Competency>();
  edit = output<Competency>();
  delete = output<Competency>();
}
