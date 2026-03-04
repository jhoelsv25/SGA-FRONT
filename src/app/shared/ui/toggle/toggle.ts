import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'sga-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="value"
      [attr.aria-readonly]="disabled()"
      [disabled]="disabled()"
      (click)="toggle()"
      [class]="
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-50 ' +
        (value ? 'bg-primary' : 'bg-base-300') + 
        ' ' + customClass()
      "
    >
      <span
        [class]="
          'pointer-events-none block h-5 w-5 rounded-full bg-base-100 shadow-lg ring-0 transition-transform ' +
          (value ? 'translate-x-5' : 'translate-x-0')
        "
      ></span>
    </button>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Toggle),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toggle implements ControlValueAccessor {
  public disabled = input<boolean>(false);
  public customClass = input<string>('');

  public value = false;

  public _onChange: (value: boolean) => void = () => {};
  public _onTouched: () => void = () => {};

  toggle() {
    if (this.disabled()) return;
    this.value = !this.value;
    this._onChange(this.value);
    this._onTouched();
  }

  // Control Value Accessor
  writeValue(value: boolean): void {
    this.value = !!value;
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
}
