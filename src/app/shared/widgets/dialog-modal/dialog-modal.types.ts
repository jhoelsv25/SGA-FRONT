import { type ViewContainerRef, type TemplateRef, type Type } from '@angular/core';

import type { ZardIcon } from '@/shared/components/icon/icons';

export type DialogModalContent<T> = string | TemplateRef<T> | Type<T>;

export interface DialogModalOptions<T = unknown, U = unknown> {
  title?: string;
  description?: string;
  content?: DialogModalContent<T>;
  data?: U;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  okText?: string | null;
  cancelText?: string | null;
  okIcon?: ZardIcon;
  cancelIcon?: ZardIcon;
  okDestructive?: boolean;
  okDisabled?: boolean;
  hideFooter?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  customClasses?: string;
  viewContainerRef?: ViewContainerRef;
  onOk?: (instance: T) => false | void | object;
  onCancel?: (instance: T) => false | void | object;
}

export interface DialogOpenConfig<U = unknown> {
  data?: U;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  panelClass?: string | string[];
  disableClose?: boolean;
  viewContainerRef?: ViewContainerRef;
}
