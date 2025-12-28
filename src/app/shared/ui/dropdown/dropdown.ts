import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
export interface DropdownItem {
  label: string;
  icon?: string;
  disabled?: boolean;
  action?: () => void;
}
@Component({
  selector: 'sga-dropdown',
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dropdown {
  public items = input<DropdownItem[]>([]);
  public showOpen = signal<boolean>(false);
  public itemSelected = output<DropdownItem>();

  toggle() {
    this.showOpen.update((value) => !value);
  }

  close() {
    this.showOpen.set(false);
  }

  handleItemClick(item: DropdownItem) {
    if (item.disabled) return;
    item.action?.();
    this.itemSelected.emit(item);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('sga-dropdown')) {
      this.close();
    }
  }
}
