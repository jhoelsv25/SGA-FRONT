import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { ZardCardComponent } from '@/shared/components/card';
import { Student } from '../../types/student-types';

@Component({
  selector: 'sga-student-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
    ZardCardComponent,
  ],
  templateUrl: './student-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCardComponent {
  student = input.required<Student>();

  edit = output<Student>();
  delete = output<Student>();
  viewDetail = output<Student>();
  viewEnrollments = output<Student>();
  viewAttendance = output<Student>();
  viewGuardians = output<Student>();
  viewObservations = output<Student>();

  readonly fullName = computed(
    () => `${this.student().firstName ?? ''} ${this.student().lastName ?? ''}`.trim() || this.student().studentCode,
  );

  readonly statusLabel = computed(() => (this.student().isActive ? 'Activo' : 'Inactivo'));
}
