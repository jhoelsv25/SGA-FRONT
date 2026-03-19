import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Institution, InstitutionStatus, INSTITUTION_STATUS_LABELS } from '../../types/institution-types';

@Component({
  selector: 'sga-institution-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
    RouterLink
  ],
  templateUrl: './institution-card.html',
  styleUrls: ['./institution-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionCardComponent {
  private alertDialog = inject(ZardAlertDialogService);

  readonly institution = input.required<Institution>();

  readonly edit = output<Institution>();
  readonly delete = output<Institution>();
  readonly statusChange = output<string>();

  public StatusEnum = InstitutionStatus;

  public isActive = computed(() => this.institution().status === InstitutionStatus.ACTIVE);

  public getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  public formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  public confirmDelete(): void {
    const inst = this.institution();
    this.alertDialog.confirm({
      zTitle: 'Eliminar Institución',
      zDescription: `¿Estás seguro de que deseas eliminar la institución "${inst.name}"? Esta acción no se puede deshacer.`,
      zOkText: 'Eliminar',
      zCancelText: 'Cancelar',
      zOkDestructive: true,
      zOnOk: () => {
        this.delete.emit(inst);
      },
    });
  }

  getStatusLabel(status: string): string {
    return INSTITUTION_STATUS_LABELS[status as string] || 'Inactiva';
  }

  changeStatus(status: string): void {
    this.statusChange.emit(status);
  }
}
