import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-skeleton',
  standalone: true,
  template: `
    <div
      [class]="'animate-pulse rounded-md bg-base-200/50 ' + customClass()"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  public customClass = input<string>('');
}
