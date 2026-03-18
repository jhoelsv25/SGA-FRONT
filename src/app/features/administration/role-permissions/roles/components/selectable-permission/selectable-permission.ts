import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../../services/api/permission-api';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';


@Component({
  selector: 'sga-selectable-permission',
  standalone: true,
  imports: [CommonModule, ZardCheckboxComponent],
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
    <label class="group flex items-center gap-3.5 p-3 rounded-2xl bg-base-200/20 border border-base-200/50 hover:bg-base-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full relative overflow-hidden">
      <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <z-checkbox 
        [zChecked]="checked()" 
        (checkChange)="toggled.emit($event)"
        color="primary"
        class="relative z-10">
      </z-checkbox>

      <!-- Icon -->
      <div class="w-9 h-9 rounded-xl bg-primary/5 text-primary/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border border-primary/5 relative z-10">
        <i class="fas fa-fingerprint text-[10px]"></i>
      </div>
      
      <div class="min-w-0 flex-1 relative z-10">
        <div class="flex items-center gap-1.5">
          <span class="text-[13px] font-bold text-base-content/80 group-hover:text-primary transition-colors block leading-none truncate">
            {{ displayName() }}
          </span>
          <span class="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded bg-primary/5 text-primary/60 border border-primary/10 shrink-0">
            {{ permission().scope || 'shared' }}
          </span>
        </div>
        
        <div class="flex items-center gap-1.5 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <i class="fas fa-code text-[8px]"></i>
          <code class="text-[9px] font-mono truncate tracking-tight">{{ permission().slug }}</code>
        </div>
      </div>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectablePermissionComponent {
  permission = input.required<Permission>();
  moduleName = input.required<string>();
  checked = input<boolean>(false);
  toggled = output<boolean>();

  displayName() {
    const name = this.permission().name;
    const mod = this.moduleName();
    return name.replace(new RegExp(`^${mod} - `), '').replace(new RegExp(`^${mod} `), '');
  }
}
