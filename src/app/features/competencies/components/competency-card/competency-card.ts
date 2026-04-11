import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Competency } from '../../types/competency-types';

@Component({
  selector: 'sga-competency-card',

  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './competency-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyCardComponent {
  competency = input.required<Competency>();
  edit = output<Competency>();
  delete = output<Competency>();
}
