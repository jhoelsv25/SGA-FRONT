import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-separator',
  standalone: true,
  template: `
    <div
      role="separator"
      [attr.aria-orientation]="orientation()"
      [class]="
        'shrink-0 bg-base-200/60 ' +
        (orientation() === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]') +
        ' ' + customClass()
      "
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Separator {
  public orientation = input<'horizontal' | 'vertical'>('horizontal');
  public customClass = input<string>('');
}
