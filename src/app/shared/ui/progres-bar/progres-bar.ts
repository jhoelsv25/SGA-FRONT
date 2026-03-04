import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-progress',
  standalone: true,
  template: `
    <div
      role="progressbar"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuenow]="value()"
      [class]="'relative w-full overflow-hidden rounded-full bg-base-200 ' + customClass()"
    >
      <div
        class="h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out"
        [style.transform]="'translateX(' + (-100 + (value() || 0)) + '%)'"
      ></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Progress {
  public value = input<number>(0);
  public max = input<number>(100);
  public customClass = input<string>('');
}
