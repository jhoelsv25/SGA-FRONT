import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AccessControlEvent } from '../../services/access-control-api';

@Component({
  selector: 'sga-access-control-events-table',

  imports: [CommonModule],
  templateUrl: './access-control-events-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlEventsTableComponent {
  readonly recentEvents = input<AccessControlEvent[]>([]);
  readonly todayCount = input<number>(0);

  eventTypeLabel(value: 'entry' | 'exit') {
    return value === 'entry' ? 'Ingreso' : 'Salida';
  }

  personTypeLabel(value?: string) {
    return value === 'teacher' ? 'Docente' : value === 'student' ? 'Estudiante' : 'Persona';
  }
}
