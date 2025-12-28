import { ChangeDetectionStrategy, Component, input, output, forwardRef } from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

@Component({
  selector: 'sga-input',
  templateUrl: './input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input implements ControlValueAccessor, Validator {
  public type = input<'text' | 'number'>('text');
  public placeholder = input<string>('');
  public disabled = input<boolean>(false);
  public value = input<string | number | null>(null);
  public required = input<boolean>(false);

  public valueChange = output<string | number | null>();

  public localValue: string | number | null = null;

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.localValue = val;
    this.valueChange.emit(val);
    this._onChange(val);
  }

  clearInput() {
    this.localValue = '';
    this.valueChange.emit('');
    this._onChange('');
  }

  // ControlValueAccessor
  public _onChange: (value: string | number | null) => void = () => {};
  public _onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.localValue = value;
  }
  registerOnChange(fn: (value: string | number | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(): void {
    // No es necesario para el estado local, el input ya lo recibe por binding
  }

  // Validator
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !control.value) return { required: true };
    return null;
  }
}
