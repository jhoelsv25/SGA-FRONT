import { inject, Injectable } from '@angular/core';

import type { DialogTypeOptions } from '@core/types/dialog-types';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Injectable({
  providedIn: 'root',
})
export class DialogConfirmService {
  private readonly alertDialog = inject(ZardAlertDialogService);

  open(options: DialogTypeOptions): Promise<string | boolean | undefined> {
    return new Promise((resolve) => {
      this.alertDialog.confirm({
        zTitle: options.title,
        zDescription: options.message,
        zOkText: options.acceptButtonProps?.label ?? 'Aceptar',
        zCancelText: options.rejectButtonProps?.label ?? 'Cancelar',
        zOkDestructive: options.type === 'danger',
        zOnOk: () => {
          options.onAccept?.();
          resolve(true);
        },
        zOnCancel: () => {
          options.onReject?.();
          resolve(false);
        },
      });
    });
  }
}
