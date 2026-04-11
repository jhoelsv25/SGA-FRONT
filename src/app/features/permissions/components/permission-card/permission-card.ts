import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission } from '@features/admin-services/api/permission-api';

@Component({
  selector: 'sga-permission-card',

  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, SgaHasPermissionDirective],
  templateUrl: './permission-card.html',
  styleUrls: ['./permission-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionCardComponent {
  private alertDialog = inject(ZardAlertDialogService);

  readonly permission = input.required<Permission>();

  readonly edit = output<Permission>();
  readonly delete = output<Permission>();

  public confirmDelete(): void {
    const p = this.permission();
    this.alertDialog.confirm({
      zTitle: 'Eliminar Permiso',
      zDescription: `¿Estás seguro de que deseas eliminar el permiso "${p.name}"? Esta acción no se puede deshacer.`,
      zOkText: 'Eliminar',
      zCancelText: 'Cancelar',
      zOkDestructive: true,
      zOnOk: () => {
        this.delete.emit(p);
      },
    });
  }
}
