import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import type { Behavior } from '../../types/behavior-types';

@Component({
  selector: 'sga-behavior-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './behavior-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviorCardComponent {
  behavior = input.required<Behavior>();

  viewDetail = output<Behavior>();
  edit = output<Behavior>();
  delete = output<Behavior>();

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      incident: 'Incidencia',
      achievement: 'Logro',
      observation: 'Observación',
      other: 'Otro',
    };
    return map[this.behavior().type] ?? this.behavior().type;
  });

  readonly severityLabel = computed(() => {
    const map: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
    };
    return map[this.behavior().severity ?? ''] ?? (this.behavior().severity || 'Sin nivel');
  });

  readonly severityClass = computed(() => {
    const map: Record<string, string> = {
      low: 'border-base-300 bg-base-200 text-base-content/70',
      medium: 'border-warning/30 bg-warning/10 text-warning-700 dark:text-warning',
      high: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
      critical: 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger',
    };
    return map[this.behavior().severity ?? ''] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });
}
