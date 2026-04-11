import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-list-toolbar',

  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-base-100 rounded-3xl border border-base-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500"
    >
      <div class="flex items-center gap-4">
        @if (icon()) {
          <div
            class="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <i [class]="icon() + ' text-xl'"></i>
          </div>
        }
        <div>
          <h2 class="text-xl font-bold text-base-content tracking-tight">{{ title() }}</h2>
          <p class="text-sm text-base-content/50">{{ description() }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <ng-content select="[list-toolbar-actions]"></ng-content>

        <div class="flex items-center gap-2">
          <ng-content select="[list-toolbar-filter]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class ListToolbarComponent {
  title = input<string>('');
  description = input<string>('');
  icon = input<string>('');
  filterCount = input<number>(0);
  showSearch = input<boolean>(true);
  searchPlaceholder = input<string>('Buscar...');
  showFilter = input<boolean>(true);

  searchChange = output<string>();
  refresh = output<void>();
}
