import { Component, input, output, model, forwardRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'z-select-option',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent],
  template: `
    <z-select
      [zPlaceholder]="placeholder()"
      [zDisabled]="disabled()"
      [(zValue)]="zValue"
      (zSelectionChange)="onValueChange($event)"
      [class]="customClass()"
    >
      @for (option of options(); track option.value) {
        <z-select-item [zValue]="String(option.value)" [zDisabled]="option.disabled">
          {{ option.label }}
        </z-select-item>
      }
    </z-select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectOptionComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOptionComponent implements ControlValueAccessor {
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input<string>('Seleccione...');
  readonly disabled = input<boolean>(false);
  readonly searchable = input<boolean>(true);
  readonly customClass = input<string>('');
  
  // Legacy compatibility inputs/outputs
  readonly value = input<any>(null);
  readonly valueChange = output<any>();
  
  zValue = model<any>('');

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined && v !== null) {
        this.zValue.set(String(v));
      }
    });
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  String = String;

  writeValue(val: any): void {
    this.zValue.set(val === undefined || val === null ? '' : String(val));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handled by input
  }

  onValueChange(val: any) {
    const normalized = val === undefined || val === null ? '' : String(val);
    this.zValue.set(normalized);
    this.onChange(normalized);
    this.valueChange.emit(normalized);
  }
}
