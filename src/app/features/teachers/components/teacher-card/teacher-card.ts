import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { ZardCardComponent } from '@/shared/components/card';
import { Teacher } from '../../types/teacher-types';
import { SgaHasPermissionDirective } from '@/shared/core';

@Component({
  selector: 'sga-teacher-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
    ZardCardComponent,
    SgaHasPermissionDirective,
  ],
  templateUrl: './teacher-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherCardComponent {
  teacher = input.required<Teacher>();
  canManage = input(true);

  edit = output<Teacher>();
  delete = output<Teacher>();
  viewDetail = output<Teacher>();
  viewAssignments = output<Teacher>();
  viewSchedules = output<Teacher>();
  viewAttendances = output<Teacher>();

  readonly fullName = computed(() => {
    const person = this.getPerson();
    return [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || 'Docente sin nombre';
  });

  readonly institutionName = computed(() => {
    const institution = this.getInstitution();
    return institution?.name ?? 'Sin institución';
  });

  readonly email = computed(() => {
    const person = this.getPerson();
    return person?.email ?? '';
  });

  readonly contractLabel = computed(() => {
    const map: Record<string, string> = {
      full_time: 'Tiempo completo',
      part_time: 'Medio tiempo',
      temporary: 'Temporal',
      permanent: 'Permanente',
    };
    return map[this.teacher().contractType] ?? this.teacher().contractType;
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      on_leave: 'Licencia',
    };
    return map[this.teacher().employmentStatus] ?? this.teacher().employmentStatus;
  });

  private getPerson(): { id: string; firstName?: string; lastName?: string; email?: string; phone?: string } | null {
    const person = this.teacher().person;
    return typeof person === 'object' ? person : null;
  }

  private getInstitution(): { id: string; name?: string } | null {
    const institution = this.teacher().institution;
    return typeof institution === 'object' ? institution : null;
  }
}
