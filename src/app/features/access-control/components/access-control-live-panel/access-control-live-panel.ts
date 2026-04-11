import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import {
  AccessControlEventType,
  AccessControlResolvedPerson,
} from '../../services/access-control-api';

@Component({
  selector: 'sga-access-control-live-panel',

  imports: [CommonModule, FormsModule, ZardInputDirective],
  templateUrl: './access-control-live-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlLivePanelComponent {
  readonly accessBlocked = input<boolean>(false);
  readonly eventType = input.required<AccessControlEventType>();
  readonly scanCode = input<string>('');
  readonly notes = input<string>('');
  readonly saving = input<boolean>(false);
  readonly resolvedPreview = input<AccessControlResolvedPerson | null>(null);
  readonly resolveError = input<string | null>(null);
  readonly resolving = input<boolean>(false);

  readonly eventTypeChange = output<AccessControlEventType>();
  readonly scanCodeChange = output<string>();
  readonly notesChange = output<string>();
  readonly resolveRequested = output<void>();
  readonly submitRequested = output<void>();

  eventTypeLabel(value: AccessControlEventType) {
    return value === 'entry' ? 'Ingreso' : 'Salida';
  }

  personTypeLabel(value?: string) {
    return value === 'teacher' ? 'Docente' : value === 'student' ? 'Estudiante' : 'Persona';
  }
}
