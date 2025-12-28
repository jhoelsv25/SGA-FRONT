import { Injectable } from '@angular/core';
import { ToastOptions } from '@core/types/toast-types';
import { toast } from 'ngx-sonner';
@Injectable({
  providedIn: 'root',
})
export class Toast {
  private defaultDuration = 4000; // 4 segundos

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  success(message: string, options?: ToastOptions): string | number {
    return toast.success(message, {
      duration: options?.duration ?? this.defaultDuration,
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? true,
    });
  }

  error(message: string, options?: ToastOptions): string | number {
    return toast.error(message, {
      duration: options?.duration ?? 6000, // Errores duran más tiempo
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? true,
    });
  }

  warning(message: string, options?: ToastOptions): string | number {
    return toast.warning(message, {
      duration: options?.duration ?? this.defaultDuration,
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? true,
    });
  }

  info(message: string, options?: ToastOptions): string | number {
    return toast.info(message, {
      duration: options?.duration ?? this.defaultDuration,
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? true,
    });
  }

  loading(message: string, options?: ToastOptions): string | number {
    return toast.loading(message, {
      duration: options?.duration ?? 0, // Loading no se auto-dismiss
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? false,
    });
  }

  /**
   * Show a promise toast
   * @param promise Promise to track
   * @param options Toast options for loading, success and error states
   */
  promise<T>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string | ((result: T) => string);
      error?: string | ((error: unknown) => string);
    },
  ): string | number | undefined {
    return toast.promise(promise, options);
  }

  /**
   * Show a custom toast
   * @param message Message to display
   * @param options Toast options
   */
  custom(message: string, options?: ToastOptions): string | number {
    return toast(message, {
      duration: options?.duration ?? this.defaultDuration,
      description: options?.description,
      position: options?.position ?? 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      important: options?.important,
      dismissible: options?.dismissible ?? true,
    });
  }

  /**
   * Dismiss a specific toast
   * @param toastId ID of the toast to dismiss
   */
  dismiss(toastId?: string | number): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
  }

  /**
   * Alias for dismissAll (more intuitive)
   */
  clear(): void {
    this.dismissAll();
  }
}
