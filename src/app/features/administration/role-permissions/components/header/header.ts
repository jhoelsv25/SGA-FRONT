import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sga-role-permission-header',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, FormsModule],
  template: `
    <div class="flex flex-col gap-6 w-full">
      <!-- MAIN HEADER CARD -->
      <div class="relative overflow-hidden flex flex-col bg-base-100/60 p-8 pt-16 rounded-[2.5rem] border border-base-200/50 shadow-2xl backdrop-blur-xl group">
        
        <!-- Tabs on Top Right -->
        <div class="absolute top-6 right-8 flex gap-1 p-1 bg-base-200/50 rounded-full border border-base-300/30 z-20">
          <button 
            (click)="tabChange.emit('roles')" 
            class="px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all"
            [class.bg-white]="activeTab() === 'roles'"
            [class.text-primary]="activeTab() === 'roles'"
            [class.shadow-sm]="activeTab() === 'roles'"
            [class.text-base-content/40]="activeTab() !== 'roles'"
          >
            SGA ROLES
          </button>
          <button 
            (click)="tabChange.emit('permissions')" 
            class="px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all"
            [class.bg-white]="activeTab() === 'permissions'"
            [class.text-primary]="activeTab() === 'permissions'"
            [class.shadow-sm]="activeTab() === 'permissions'"
            [class.text-base-content/40]="activeTab() !== 'permissions'"
          >
            PERMISOS
          </button>
        </div>

        <!-- Visual Decor -->
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000"></div>
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-[60px] group-hover:bg-secondary/10 transition-all duration-1000"></div>

        <!-- Row Content -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <!-- Left Info -->
          <div class="flex items-center gap-6 relative z-10">
            <div class="size-16 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-2xl shadow-primary/40 rotate-2 group-hover:rotate-0 transition-transform duration-500">
              <i class="fa text-3xl" [class]="icon()"></i>
            </div>
            <div class="space-y-1">
              <h1 class="text-4xl font-black text-base-content tracking-tighter uppercase leading-none">
                {{ title() }}
              </h1>
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-success animate-pulse"></span>
                <p class="text-sm font-bold text-base-content/40 uppercase tracking-widest inter">
                  {{ description() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Right Action -->
          <button 
            z-button 
            zColor="primary" 
            (click)="create.emit()" 
            class="rounded-full h-18 px-10 shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all text-xl font-black tracking-widest relative z-10 border-4 border-white/20"
          >
            <i class="fa fa-plus-circle mr-3"></i> {{ buttonText() }}
          </button>
        </div>
      </div>

      <!-- SEARCH BAR -->
      <div class="relative group/search animate-in fade-in slide-in-from-top-4 duration-1000">
        <div class="absolute inset-0 bg-primary/5 rounded-[1.8rem] blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity"></div>
        <i class="fa fa-search absolute left-6 top-1/2 -translate-y-1/2 text-base-content/20 text-xl group-focus-within/search:text-primary transition-colors z-20"></i>
        <input 
          type="text" 
          [ngModel]="searchTerm()" 
          (ngModelChange)="search.emit($event)"
          [placeholder]="placeholder()"
          class="relative z-10 w-full pl-16 pr-8 py-5 rounded-[1.8rem] bg-base-100 border-2 border-base-200 focus:border-primary/30 text-base font-bold transition-all outline-none shadow-sm hover:shadow-md focus:shadow-2xl inter" 
        />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .inter { font-family: 'Inter', sans-serif; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePermissionHeaderComponent {
  title = input.required<string>();
  description = input.required<string>();
  buttonText = input.required<string>();
  icon = input.required<string>();
  searchTerm = input<string>('');
  placeholder = input<string>('Buscar...');
  
  activeTab = input<'roles' | 'permissions'>('roles');

  create = output<void>();
  search = output<string>();
  tabChange = output<'roles' | 'permissions'>();
}
