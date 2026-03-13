import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ZardDropdownMenuComponent, ZardDropdownMenuItemComponent } from '@shared/components/dropdown';

export interface DropdownItem {
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  action?: () => void;
}

@Component({
  selector: 'sga-dropdown',
  standalone: true,
  imports: [ZardDropdownMenuComponent, ZardDropdownMenuItemComponent],
  templateUrl: './dropdown.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dropdown {
  public items = input<DropdownItem[]>([]);
  public itemSelected = output<DropdownItem>();

  handleItemClick(item: DropdownItem) {
    if (item.disabled || item.separator) return;
    item.action?.();
    this.itemSelected.emit(item);
  }
}
