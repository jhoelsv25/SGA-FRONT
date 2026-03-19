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
import { Role } from '@features/admin-services/api/role-api';

@Component({
  selector: 'sga-role-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './role-card.html',
  styleUrls: ['./role-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCardComponent {
  private alertDialog = inject(ZardAlertDialogService);

  readonly role = input.required<Role>();
  readonly selected = input(false);

  readonly roleSelected = output<Role>();
  readonly editClicked = output<Role>();
  readonly deleteClicked = output<Role>();

  public isActive = computed(() => this.role().isActive);

  public confirmDelete(): void {
    const r = this.role();
    this.alertDialog.confirm({
      zTitle: 'Eliminar Rol',
      zDescription: `¿Estás seguro de que deseas eliminar el rol "${r.name}"? Esta acción no se puede deshacer.`,
      zOkText: 'Eliminar',
      zCancelText: 'Cancelar',
      zOkDestructive: true,
      zOnOk: () => {
        this.deleteClicked.emit(r);
      },
    });
  }
}
