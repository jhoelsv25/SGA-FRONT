import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { SelectablePermissionComponent } from '../selectable-permission/selectable-permission';
import { Permission } from '@features/admin-services/api/permission-api';

interface PermissionGroup {
  module: string;
  icon: string;
  permissions: Permission[];
}


@Component({
  selector: 'sga-permission-group-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardCheckboxComponent, SelectablePermissionComponent],
  template: `
    <z-card class="module-card rounded-4xl border border-base-200 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 overflow-hidden bg-base-100 flex flex-col h-full">
      <!-- Module Header -->
      <div class="flex flex-col space-y-1.5 p-6 bg-base-200/5 border-b border-base-200 py-6 px-8 flex flex-row items-center justify-between">
        <div class="flex items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-primary text-primary-content shadow-lg shadow-primary/20 flex items-center justify-center text-2xl">
            <i [class]="'fa-solid fa-' + group().icon"></i>
          </div>
          <div>
            <h3 class="text-xl font-extrabold text-base-content tracking-tight">{{group().module}}</h3>
            <p class="text-[10px] font-black text-base-content/30 uppercase tracking-widest leading-none mt-1">Grupo de Permisos del Módulo</p>
          </div>
        </div>
        
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
        <label class="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-base-100 border border-base-200 cursor-pointer hover:border-primary/40 transition-all shadow-sm group">
          <z-checkbox 
            [zChecked]="isFullyChecked()" 
            (checkChange)="toggleGroup.emit($event)"
            color="primary">
          </z-checkbox>
          <span class="text-xs font-bold text-base-content/50 group-hover:text-primary transition-colors">Seleccionar Todo el Módulo</span>
        </label>
      </div>

      <div class="p-6 pt-0 p-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (perm of group().permissions; track perm.id) {
            <sga-selectable-permission
              [permission]="perm"
              [moduleName]="group().module"
              [checked]="isPermissionChecked(perm.id)"
              (toggled)="togglePermission.emit(perm.id)">
            </sga-selectable-permission>
          }
        </div>
      </div>
    </z-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionGroupCardComponent {
  group = input.required<PermissionGroup>();
  checkedPermissions = input.required<Set<string>>();
  
  toggleGroup = output<boolean>();
  togglePermission = output<string>();

  isPermissionChecked(id: string): boolean {
    return this.checkedPermissions().has(id);
  }

  isFullyChecked(): boolean {
    const permissions = this.group().permissions;
    if (permissions.length === 0) return false;
    return permissions.every(p => this.isPermissionChecked(p.id));
  }
}
