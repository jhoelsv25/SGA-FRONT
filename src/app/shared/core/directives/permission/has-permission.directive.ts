import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

type PermissionValue = string | string[] | null | undefined;
type PermissionMode = 'any' | 'all';

@Directive({
  selector: '[sgaHasPermission]',
})
export class SgaHasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionStore = inject(PermissionCheckStore);

  readonly sgaHasPermission = input<PermissionValue>(undefined);
  readonly sgaHasPermissionMode = input<PermissionMode>('any');
  readonly sgaHasPermissionNegate = input(false);

  private hasView = false;

  constructor() {
    effect(() => {
      this.permissionStore.currentUser();
      this.permissionStore.allPermissions();
      this.syncView();
    });
  }

  private syncView(): void {
    const allowed = this.evaluatePermission();

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private evaluatePermission(): boolean {
    const requirement = this.sgaHasPermission();
    const mode = this.sgaHasPermissionMode();
    const negate = this.sgaHasPermissionNegate();

    if (!requirement || (Array.isArray(requirement) && requirement.length === 0)) {
      return negate ? false : true;
    }

    const permissions = Array.isArray(requirement) ? requirement : [requirement];
    const result =
      mode === 'all'
        ? this.permissionStore.hasAll(...permissions)
        : this.permissionStore.hasAny(...permissions);

    return negate ? !result : result;
  }
}
