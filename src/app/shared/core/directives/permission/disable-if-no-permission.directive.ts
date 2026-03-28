import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

type PermissionValue = string | string[] | null | undefined;
type PermissionMode = 'any' | 'all';

@Directive({
  selector: '[sgaDisableIfNoPermission]',
  standalone: true,
})
export class SgaDisableIfNoPermissionDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly permissionStore = inject(PermissionCheckStore);

  readonly sgaDisableIfNoPermission = input<PermissionValue>(undefined);
  readonly sgaDisableIfNoPermissionMode = input<PermissionMode>('any');

  constructor() {
    effect(() => {
      this.permissionStore.currentUser();
      this.permissionStore.allPermissions();
      this.syncDisabledState();
    });
  }

  private syncDisabledState(): void {
    const requirement = this.sgaDisableIfNoPermission();
    const mode = this.sgaDisableIfNoPermissionMode();

    if (!requirement || (Array.isArray(requirement) && requirement.length === 0)) {
      this.setDisabled(false);
      return;
    }

    const permissions = Array.isArray(requirement) ? requirement : [requirement];
    const allowed =
      mode === 'all'
        ? this.permissionStore.hasAll(...permissions)
        : this.permissionStore.hasAny(...permissions);

    this.setDisabled(!allowed);
  }

  private setDisabled(disabled: boolean): void {
    const nativeElement = this.elementRef.nativeElement as HTMLElement & { disabled?: boolean };

    if ('disabled' in nativeElement) {
      nativeElement.disabled = disabled;
    }

    if (disabled) {
      this.renderer.setAttribute(nativeElement, 'aria-disabled', 'true');
      this.renderer.addClass(nativeElement, 'pointer-events-none');
      this.renderer.addClass(nativeElement, 'opacity-60');
    } else {
      this.renderer.removeAttribute(nativeElement, 'aria-disabled');
      this.renderer.removeClass(nativeElement, 'pointer-events-none');
      this.renderer.removeClass(nativeElement, 'opacity-60');
    }
  }
}
