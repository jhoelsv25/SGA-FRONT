import { inject, Injectable } from '@angular/core';

import { DialogPosition, DialogTypeOptions } from '@core/types/dialog-types';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialog {
  private readonly dialogConfirm = inject(DialogConfirmService);

  open(
    options: DialogTypeOptions,
    position: DialogPosition = 'top-center',
  ): Promise<string | boolean | undefined> {
    void position;
    return this.dialogConfirm.open(options);
  }

  close(): void {
    // Zard refs manage their own lifecycle; kept for API compatibility.
  }
}
