import { Component, input, output, model, forwardRef, ChangeDetectionStrategy, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'z-select-option',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  template: `
    <z-select
      [zPlaceholder]="placeholder()"
      [zDisabled]="disabled()"
      [(zValue)]="zValue"
      (zSelectionChange)="onValueChange($event)"
      [zCanLoadMore]="canLoadMore()"
      (zScrolledToEnd)="onLoadMore()"
      [class]="customClass()"
    >
      <div class="sticky top-0 z-10 border-b border-border/50 bg-popover p-2">
        <input
          z-input
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar..."
          class="w-full"
        />
      </div>
      @for (option of filteredOptions(); track option.value) {
        <z-select-item [zValue]="String(option.value)" [zDisabled]="option.disabled">
          {{ option.label }}
        </z-select-item>
      }
      @if (!filteredOptions().length && !loadingMore()) {
        <z-select-item zValue="__empty__" [zDisabled]="true">
          Sin resultados
        </z-select-item>
      }
      @if (loadingMore()) {
        <z-select-item zValue="__loading__" [zDisabled]="true">
          Cargando más...
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
  readonly canLoadMore = input<boolean>(false);
  readonly loadingMore = input<boolean>(false);
  
  // Legacy compatibility inputs/outputs
  readonly value = input<any>(null);
  readonly valueChange = output<any>();
  readonly loadMore = output<void>();
  
  zValue = model<any>('');
  searchTerm = signal('');
  filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.options();
    return this.options().filter((option) => option.label.toLowerCase().includes(term));
  });

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

  onLoadMore() {
    if (this.canLoadMore() && !this.loadingMore()) {
      this.loadMore.emit();
    }
  }

  onSearch(value: string) {
    this.searchTerm.set(value ?? '');
  }
}
