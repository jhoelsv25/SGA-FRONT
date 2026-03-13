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
  selector: 'sga-textarea',
  templateUrl: './textarea.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Textarea implements ControlValueAccessor, Validator {
  @ViewChild('textareaElement') textareaRef!: ElementRef<HTMLTextAreaElement>;

  public placeholder = input<string>('');
  public disabled = input<boolean>(false);
  public required = input<boolean>(false);
  public rows = input<number>(3);
  public customClass = input<string>('');

  public valueChange = output<string | number | null>();

  public localValue: string | number | null = null;
  public touched = signal(false);

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.localValue = val;
    this.valueChange.emit(val);
    this._onChange(val);
  }

  onBlur() {
    this.touched.set(true);
    this._onTouched();
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
    // Usually managed by the caller matching local `[disabled]="disabled()"`
    void isDisabled;
  }

  // Validator
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !control.value) return { required: true };
    return null;
  }
}
