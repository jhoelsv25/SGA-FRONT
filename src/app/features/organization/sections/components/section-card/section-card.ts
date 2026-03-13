import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/adapters/ui/card/card';
import { Button } from '@shared/directives';
import type { Section } from '../../types/section-types';

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
};

@Component({
  selector: 'sga-section-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './section-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  section = input.required<Section>();
  edit = output<Section>();
  delete = output<Section>();

  shiftLabel(shift?: string): string {
    return (shift && SHIFT_LABELS[shift]) || shift || '-';
  }
}
