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
import { Institution } from '../../types/institution-types';

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

  public isActive = computed(() => this.institution().status === 'active');

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
    const labels: Record<string, string> = {
      active: 'activas',
      inactive: 'inactiva',
      pending: 'pendiente',
    };
    return labels[status.toLowerCase()] || 'inactivo';
  }
}
