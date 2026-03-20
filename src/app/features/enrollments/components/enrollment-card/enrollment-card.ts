import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import type { Enrollment } from '../../types/enrollment-types';

@Component({
  selector: 'sga-enrollment-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverComponent,
    ZardPopoverDirective,
  ],
  templateUrl: './enrollment-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentCardComponent {
  enrollment = input.required<Enrollment>();

  viewDetail = output<Enrollment>();
  edit = output<Enrollment>();
  delete = output<Enrollment>();

  readonly studentName = computed(() => {
    const student = this.enrollment().student;
    const personName = student?.person
      ? `${student.person.firstName ?? ''} ${student.person.lastName ?? ''}`.trim()
      : '';
    return personName || `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || student?.studentCode || 'Sin estudiante';
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      enrolled: 'Matriculado',
      completed: 'Completado',
      dropped: 'Retirado',
      graduated: 'Egresado',
    };
    return map[this.enrollment().status] ?? this.enrollment().status;
  });

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      new: 'Nuevo',
      returning: 'Reinscripción',
      transfer: 'Traslado',
    };
    return map[this.enrollment().enrollmentType] ?? this.enrollment().enrollmentType;
  });

  readonly statusClass = computed(() => {
    const map: Record<string, string> = {
      enrolled: 'border-success/30 bg-success/10 text-success-700 dark:text-success',
      completed: 'border-primary/30 bg-primary/10 text-primary',
      dropped: 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger',
      graduated: 'border-base-300 bg-base-200 text-base-content/70',
    };
    return map[this.enrollment().status] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });
}
