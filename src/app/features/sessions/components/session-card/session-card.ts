import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent, type ZardIcon } from '@/shared/components/icon';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Session } from '@features/admin-services/api/session-api';

@Component({
  selector: 'sga-session-card',

  imports: [CommonModule, ZardCardComponent, ZardButtonComponent, ZardIconComponent],
  templateUrl: './session-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionCardComponent {
  private alertDialog = inject(ZardAlertDialogService);

  readonly session = input.required<Session>();
  readonly revoke = output<string>();

  public confirmRevoke(): void {
    const s = this.session();
    this.alertDialog.confirm({
      zTitle: 'Revocar Sesión',
      zDescription: `¿Estás seguro de que deseas revocar la sesión para "${s.user.firstName} ${s.user.lastName}"? El usuario será desconectado de inmediato.`,
      zOkText: 'Revocar',
      zCancelText: 'Cancelar',
      zOkDestructive: true,
      zOnOk: () => {
        this.revoke.emit(s.id);
      },
    });
  }

  readonly deviceIcon = computed<ZardIcon>(() => {
    const ua = this.session().userAgent.toLowerCase();
    if (ua.includes('mobi')) return 'smartphone';
    if (ua.includes('tablet')) return 'tablet';
    return 'monitor';
  });

  readonly deviceClass = computed(() => {
    const ua = this.session().userAgent.toLowerCase();
    if (ua.includes('mobi'))
      return 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white';
    if (ua.includes('tablet'))
      return 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white';
    return 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content';
  });
}
