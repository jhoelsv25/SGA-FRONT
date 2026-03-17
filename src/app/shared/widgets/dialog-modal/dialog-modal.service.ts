import { Z_MODAL_DATA } from '@shared/components/dialog';
import { inject, Injectable, type TemplateRef, type Type } from '@angular/core';

import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import type { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';

import type { DialogModalOptions, DialogOpenConfig } from './dialog-modal.types';

@Injectable({
  providedIn: 'root',
})
export class DialogModalService {
  private readonly dialog = inject(ZardDialogService);

  open<C = unknown, U = unknown>(options: DialogModalOptions<C, U>): ZardDialogRef<C, unknown, U>;
  open<R = unknown, D = unknown, C = unknown>(
    content: string | TemplateRef<C> | Type<C>,
    config?: DialogOpenConfig<D>,
  ): ZardDialogRef<C, R, D>;
  open<R = unknown, D = unknown, C = unknown>(
    optionsOrContent: DialogModalOptions<C, D> | string | TemplateRef<C> | Type<C>,
    config?: DialogOpenConfig<D>,
  ): ZardDialogRef<C, R, D> {
    const options = this.normalizeOptions(optionsOrContent, config);

    return this.dialog.create<C, D>({
      zTitle: options.title,
      zDescription: options.description,
      zContent: options.content,
      zData: options.data,
      zWidth: options.width,
      zHeight: options.height,
      zMinHeight: options.minHeight,
      zMaxHeight: options.maxHeight,
      zOkText: options.okText,
      zCancelText: options.cancelText,
      zOkIcon: options.okIcon,
      zCancelIcon: options.cancelIcon,
      zOkDestructive: options.okDestructive,
      zOkDisabled: options.okDisabled,
      zHideFooter: options.hideFooter,
      zClosable: options.closable,
      zMaskClosable: options.maskClosable,
      zCustomClasses: options.customClasses,
      zViewContainerRef: options.viewContainerRef,
      zOnOk: options.onOk,
      zOnCancel: options.onCancel,
    });
  }

  private normalizeOptions<C, D>(
    optionsOrContent: DialogModalOptions<C, D> | string | TemplateRef<C> | Type<C>,
    config?: DialogOpenConfig<D>,
  ): DialogModalOptions<C, D> {
    const isComponentContent = this.isComponentType(optionsOrContent);

    if (
      typeof optionsOrContent === 'string' ||
      this.isTemplateRef(optionsOrContent) ||
      isComponentContent
    ) {
      return {
        content: optionsOrContent,
        data: config?.data,
        width: config?.width,
        height: config?.height,
        minHeight: config?.minHeight,
        maxHeight: config?.maxHeight,
        customClasses: this.normalizePanelClass(config?.panelClass),
        hideFooter: isComponentContent,
        closable: isComponentContent ? false : !(config?.disableClose ?? false),
        maskClosable: !(config?.disableClose ?? false),
        viewContainerRef: config?.viewContainerRef,
      };
    }

    return optionsOrContent;
  }

  private normalizePanelClass(panelClass?: string | string[]): string | undefined {
    if (!panelClass) return undefined;
    return Array.isArray(panelClass) ? panelClass.join(' ') : panelClass;
  }

  private isTemplateRef<T>(value: unknown): value is TemplateRef<T> {
    return !!value && typeof value === 'object' && 'createEmbeddedView' in value;
  }

  private isComponentType<T>(value: unknown): value is Type<T> {
    return typeof value === 'function';
  }
}
