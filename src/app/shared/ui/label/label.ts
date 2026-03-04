import { Directive, input, HostBinding } from '@angular/core';

@Directive({
  selector: '[sgaLabel]',
  standalone: true,
})
export class LabelDirective {
  public customClass = input<string>('');
  public htmlFor = input<string>('');

  @HostBinding('class')
  get classes(): string {
    return 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base-content/90 ' + this.customClass();
  }
}
