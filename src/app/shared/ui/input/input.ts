import { ChangeDetectionStrategy, Component, input, output, forwardRef, ElementRef, ViewChild, signal } from '@angular/core';
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
  standalone: true
})
export class Input implements ControlValueAccessor, Validator {
  @ViewChild('inputElement') inputRef!: ElementRef<HTMLInputElement>;

  public type = input<'text' | 'number' | 'email' | 'password' | 'date' | 'tel' | 'url' | 'time'>('text');
  public placeholder = input<string>('');
  public disabled = input<boolean>(false);
  public required = input<boolean>(false);
  public customClass = input<string>('');
  public id = input<string | undefined>(undefined);

  public valueChange = output<string | number | null>();

  public localValue: string | number | null = null;
  public touched = signal(false);

  // Determine if it needs left padding for an icon
  hasIconPrefix(): boolean {
    const t = this.type();
    return ['number', 'email', 'password', 'date', 'tel'].includes(t);
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.localValue = val;
    this.valueChange.emit(val);
    this._onChange(val);
  }

  onBlur() {
    this.touched.set(true);
    this._onTouched();
  }

  clearInput() {
    this.localValue = '';
    // Optional: focus input after clearing
    this.inputRef?.nativeElement?.focus();
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
  setDisabledState(isDisabled: boolean): void {
    // The input binds natively to disabled(), but since CVA controls disabled state from forms:
    // we would actually need to update the disabled signal if we could, 
    // but typically users will bind [disabled]="true" or the form passes it.
    void isDisabled;
  }

  // Validator
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !control.value) return { required: true };
    return null;
  }
}
