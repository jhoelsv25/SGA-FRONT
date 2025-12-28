
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-avatar',
  imports: [NgClass],
  template: `
    <img
      [src]="src()"
      [alt]="alt()"
      [ngClass]="{
        'w-8 h-8': size() === 'sm',
        'w-12 h-12': size() === 'md',
        'w-16 h-16': size() === 'lg',
        'w-24 h-24': size() === 'xl',
      }"
      class="rounded-full object-cover"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar {
  public src = input<string>();
  public alt = input<string>();
  public size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
}
