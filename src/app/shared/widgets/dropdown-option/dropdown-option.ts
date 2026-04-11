import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardDropdownMenuComponent } from '@/shared/components/dropdown/dropdown.component';
import { ZardDropdownMenuItemComponent } from '@/shared/components/dropdown/dropdown-item.component';

export interface DropdownItem {
  label: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

@Component({
  selector: 'z-dropdown',

  imports: [CommonModule, ZardDropdownMenuComponent, ZardDropdownMenuItemComponent],
  template: `
    <z-dropdown-menu [align]="align()">
      <div dropdown-trigger>
        <ng-content
          select="[sga-dropdown-trigger], [z-dropdown-trigger], [dropdown-trigger], [dropdown-trigger-content]"
        ></ng-content>
      </div>

      <div class="p-1">
        @for (item of items(); track $index) {
          @if (item.separator) {
            <div class="h-px bg-base-300 my-1 mx-[-0.25rem]"></div>
          } @else {
            <z-dropdown-menu-item
              (click)="!item.disabled && item.action && item.action()"
              [attr.data-disabled]="item.disabled ? '' : null"
              class="flex items-center gap-2"
            >
              @if (item.icon) {
                <i [class]="item.icon + ' text-xs w-4 opacity-70'"></i>
              }
              <span>{{ item.label }}</span>
            </z-dropdown-menu-item>
          }
        }
        <ng-content></ng-content>
      </div>
    </z-dropdown-menu>
  `,
})
export class DropdownOptionComponent {
  readonly items = input<DropdownItem[]>([]);
  readonly align = input<'start' | 'end'>('start');
}
