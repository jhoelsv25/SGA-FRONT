import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-empty-state',
  standalone: true,
  imports: [Button],
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  /** Clase CSS para iconos de FontAwesome (ej: 'fas fa-building') */
  public iconClass = input.required<string>();

  /** Título del estado vacío */
  public title = input.required<string>();

  /** Descripción del estado vacío */
  public description = input.required<string>();

  /** Texto del botón de acción (opcional) */
  public actionLabel = input<string | null>(null);

  /** Emite cuando el usuario pulsa el botón de acción */
  public action = output<void>();
}
