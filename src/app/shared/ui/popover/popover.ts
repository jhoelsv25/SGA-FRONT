import { Component, ChangeDetectionStrategy, signal, input, HostListener } from '@angular/core';

@Component({
  selector: 'sga-popover',
  standalone: true,
  template: `
    <div class="relative inline-block text-left">
      <!-- Popover Trigger -->
      <div (click)="toggle()" (keydown.enter)="toggle()" tabindex="0" role="button">
        <ng-content select="[sga-popover-trigger]"></ng-content>
      </div>

      <!-- Popover Content -->
      @if (isOpen()) {
        <div
          class="absolute z-50 w-72 rounded-md border border-base-200 bg-base-100 p-4 text-base-content shadow-md outline-none animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 mt-2 right-0"
        >
          <ng-content select="[sga-popover-content]"></ng-content>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Popover {
  public align = input<'start' | 'center' | 'end'>('center');
  public side = input<'top' | 'bottom' | 'left' | 'right'>('bottom');

  public isOpen = signal(false);

  toggle() {
    this.isOpen.update((v) => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('sga-popover')) {
      this.close();
    }
  }
}
