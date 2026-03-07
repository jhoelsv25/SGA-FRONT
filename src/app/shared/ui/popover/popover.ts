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
          class="absolute z-50 w-72 rounded-xl  outline-none animate-in fade-in zoom-in-95 p-4 right-0"
          [class]="
            (side() === 'top' ? 'bottom-full mb-2' : 'mt-2') +
            (contentClass() ? ' ' + contentClass() : '')
          "
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
  public contentClass = input<string>('');

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
