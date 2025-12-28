import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'sga-radio',
  imports: [],
  templateUrl: './radio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Radio),
      multi: true,
    },
  ],
})
export class Radio {
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.select(input.value);
  }
  name = input<string>();
  value = input<string | number | boolean>();
  label = input<string>('Opción');

  innerValue: string | number | boolean | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onChange = (_value: string | number | boolean) => {};
  private onTouched = () => {};

  isChecked(): boolean {
    // Comparación estricta por tipo
    if (typeof this.value() === 'boolean') {
      return this.innerValue === this.value();
    }
    if (typeof this.value() === 'number') {
      return Number(this.innerValue) === this.value();
    }
    return String(this.innerValue) === String(this.value());
  }

  select(val: string | number | boolean) {
    let parsed: string | number | boolean = val;
    // Si el valor original es boolean, parsea el string
    if (typeof this.value() === 'boolean') {
      parsed = String(val) === 'true';
    } else if (typeof this.value() === 'number') {
      parsed = Number(val);
    }
    this.innerValue = parsed;
    this.onChange(parsed);
    this.onTouched();
  }

  writeValue(value: string | number | boolean): void {
    // Si el valor original es boolean, parsea el string
    if (typeof this.value() === 'boolean' && typeof value === 'string') {
      this.innerValue = value === 'true';
    } else if (typeof this.value() === 'number' && typeof value === 'string') {
      this.innerValue = Number(value);
    } else {
      this.innerValue = value;
    }
  }

  registerOnChange(fn: (value: string | number | boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  boxClass() {
    const base = 'border-2 flex items-center justify-center';
    return (
      base +
      ' border-primary-500 bg-white text-primary-600' +
      (this.isChecked() ? ' bg-primary-100' : '')
    );
  }
}
