import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Section } from '../../types/section-types';

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
};

@Component({
  selector: 'sga-section-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
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
