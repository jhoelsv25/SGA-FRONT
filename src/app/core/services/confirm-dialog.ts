import { ComponentRef, inject, Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { DialogPosition, DialogTypeOptions } from '@core/types/dialog-types';
import { ComponentPortal } from '@angular/cdk/portal';
import { DialogConfirm } from '@shared/components/dialog-confirm/dialog-confirm';
@Injectable({
  providedIn: 'root',
})
export class ConfirmDialog {
  private overlayRef?: OverlayRef;
  private overlay = inject(Overlay);

  open(
    options: DialogTypeOptions,
    position: DialogPosition = 'top-center',
  ): Promise<string | boolean | undefined> {
    return new Promise((resolve) => {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        panelClass: 'dialog-overlay-panel',
        positionStrategy: this.getPositionStrategy(position),
      });

      const portal = new ComponentPortal(DialogConfirm);
      const componentRef: ComponentRef<DialogConfirm> = this.overlayRef.attach(portal);

      // Pasar options como signal
      componentRef.instance.options.set(options);

      // --- Promises ---
      componentRef.instance.confirmed.subscribe((value: string | boolean) => {
        if (typeof value === 'string' || typeof value === 'undefined') {
          options.onAccept?.(value);
        }
        this.close();
        resolve(value);
      });

      componentRef.instance.rejected.subscribe(() => {
        options.onReject?.();
        this.close();
        resolve(false);
      });

      this.overlayRef.backdropClick().subscribe(() => {
        options.onReject?.();
        this.close();
        resolve(false);
      });
    });
  }

  close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  private getPositionStrategy(position: DialogPosition) {
    const strategy = this.overlay.position().global();

    switch (position) {
      case 'top-center':
        return strategy.centerHorizontally().top('20px');
      case 'bottom-center':
        return strategy.centerHorizontally().bottom('20px');
      case 'left':
        return strategy.left('20px').centerVertically();
      case 'right':
        return strategy.right('20px').centerVertically();
      case 'center':
      default:
        return strategy.centerHorizontally().centerVertically();
    }
  }
}
