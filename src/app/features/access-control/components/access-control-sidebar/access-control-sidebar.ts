import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AccessControlEvent } from '../../services/access-control-api';

type GeofenceStatus = {
  within: boolean;
  distance: number;
  radius: number;
} | null;

@Component({
  selector: 'sga-access-control-sidebar',

  imports: [CommonModule],
  templateUrl: './access-control-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlSidebarComponent {
  readonly lastRegistered = input<AccessControlEvent | null>(null);
  readonly needsLocationValidation = input<boolean>(false);
  readonly locationReady = input<boolean>(false);
  readonly geofenceStatus = input<GeofenceStatus>(null);
  readonly geoError = input<string | null>(null);
  readonly locationHelpText = input<string>('');
  readonly retryLocation = output<void>();

  eventTypeLabel(value: 'entry' | 'exit') {
    return value === 'entry' ? 'Ingreso' : 'Salida';
  }

  personTypeLabel(value?: string) {
    return value === 'teacher' ? 'Docente' : value === 'student' ? 'Estudiante' : 'Persona';
  }
}
