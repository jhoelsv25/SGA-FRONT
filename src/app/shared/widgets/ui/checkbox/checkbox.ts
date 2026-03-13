import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'sga-checkbox',
  imports: [],
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
})
export class Checkbox implements ControlValueAccessor {
  label = input<string>('');
  checked = input(false);
  color = input<string>('primary');

  public changeOutput = output<boolean>();
  public valueChanged = signal<boolean>(false); // signal público

  public currentChecked = signal(this.checked());
  private isControlledByForm = false;

  constructor() {
    // Sincroniza el signal con el input checked
    effect(() => {
      if (!this.isControlledByForm) {
        this.currentChecked.set(this.checked());
      }
      this.valueChanged.set(this.isChecked()); // actualiza el signal público
    });
  }

  // Decide el valor a mostrar según si está controlado por Angular Forms
  isChecked(): boolean {
    return this.isControlledByForm ? this.currentChecked() : this.checked();
  }

  // ControlValueAccessor
  writeValue(value: boolean): void {
    this.currentChecked.set(value);
    this.isControlledByForm = true;
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange = (_value: boolean): void => {};
  private onTouched = (): void => {};

  onToggle(event: Event) {
    const val = (event.target as HTMLInputElement).checked;
    this.currentChecked.set(val);
    this.valueChanged.set(val); // actualiza el signal público
    if (this.isControlledByForm) {
      this.onChange(val);
      this.onTouched();
    } else {
      this.changeOutput.emit(val);
    }
  }

  boxClass() {
    const base = 'border-2 flex items-center justify-center';
    // Siempre usar el color primary (primary) si no se especifica
    const color = this.color() || 'primary';
    if (color === 'primary') {
      return (
        base +
        ' border-primary-500 bg-white text-primary-600' +
        (this.isChecked() ? ' bg-primary-100' : '')
      );
    }
    if (color === 'secondary') {
      return (
        base + ' border-gray-400 bg-white text-gray-600' + (this.isChecked() ? ' bg-gray-100' : '')
      );
    }
    if (color === 'success') {
      return (
        base +
        ' border-green-500 bg-white text-green-600' +
        (this.isChecked() ? ' bg-green-100' : '')
      );
    }
    if (color === 'danger') {
      return (
        base + ' border-red-500 bg-white text-red-600' + (this.isChecked() ? ' bg-red-100' : '')
      );
    }
    if (color === 'warning') {
      return (
        base +
        ' border-yellow-400 bg-white text-yellow-500' +
        (this.isChecked() ? ' bg-yellow-100' : '')
      );
    }
    if (color === 'info') {
      return (
        base + ' border-blue-500 bg-white text-blue-600' + (this.isChecked() ? ' bg-blue-100' : '')
      );
    }
    if (color === 'dark') {
      return (
        base + ' border-gray-900 bg-white text-gray-900' + (this.isChecked() ? ' bg-gray-200' : '')
      );
    }
    // fallback
    return (
      base +
      ' border-primary-500 bg-white text-primary-600' +
      (this.isChecked() ? ' bg-primary-100' : '')
    );
  }
}
