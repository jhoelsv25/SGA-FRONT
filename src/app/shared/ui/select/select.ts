import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

export interface SelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
  [key: string]: unknown; // Para propiedades adicionales dinámicas
}

export interface SelectConfig {
  keyField?: string; // Campo que se usará como value (por defecto 'value')
  labelField?: string; // Campo que se usará como label (por defecto 'label')
  disabledField?: string; // Campo que se usará para disabled (por defecto 'disabled')
  searchFields?: string[]; // Campos en los que buscar (por defecto ['label'])
}

// Providers para formularios reactivos
const VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Select),
  multi: true,
};

const NG_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => Select),
  multi: true,
};

@Component({
  selector: 'sga-select',
  imports: [],
  templateUrl: './select.html',
  providers: [VALUE_ACCESSOR, NG_VALIDATOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  // Inputs con signals
  options = input<SelectOption[]>([]); // Changed to SelectOption[]
  config = input<SelectConfig>({}); // Configuración de campos
  placeholder = input<string>('Seleccionar...');
  searchPlaceholder = input<string>('Buscar...');
  disabled = input<boolean>(false);
  multiple = input<boolean>(false);
  clearable = input<boolean>(true);
  searchable = input<boolean>(true);
  loading = input<boolean>(false);
  value = input<unknown>(null);
  required = input<boolean>(false); // Para validación
  showAddButton = input<boolean>(false);

  // Outputs
  valueChange = output<unknown>();
  searchChange = output<string>();
  opened = output<void>();
  closed = output<void>();
  cleared = output<void>();
  addRequested = output<string>();

  // Propiedades para ControlValueAccessor
  private _value: unknown = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _onChange = (_value: unknown) => {};
  private _onTouched = () => {};
  private _disabled = false;

  // Signals internos
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedOption = signal<SelectOption | SelectOption[] | null>(null);
  highlightedIndex = signal<number>(-1);

  // ViewChild para el input de búsqueda
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // Computed para obtener la configuración con valores por defecto
  selectConfig = computed(() => {
    const defaultConfig: SelectConfig = {
      keyField: 'value',
      labelField: 'label',
      disabledField: 'disabled',
    };
    const merged = { ...defaultConfig, ...this.config() };
    // Si no se provee searchFields, usar labelField
    if (!merged.searchFields || merged.searchFields.length === 0) {
      merged.searchFields = [merged.labelField!];
    }
    return merged;
  });

  // Computed helpers para acceder a los campos
  getOptionValue = computed(() => {
    const config = this.selectConfig();
    return (option: SelectOption) => option[config.keyField!];
  });

  getOptionLabel = computed(() => {
    const config = this.selectConfig();
    return (option: SelectOption) => option[config.labelField!];
  });

  getOptionDisabled = computed(() => {
    const config = this.selectConfig();
    return (option: SelectOption) => option[config.disabledField!] || false;
  });

  // Computed para las opciones filtradas
  filteredOptions = computed(() => {
    const options = this.options();
    let search = this.searchTerm().toLowerCase().trim();
    const config = this.selectConfig();

    // Helper para normalizar (eliminar acentos, espacios extra, minúsculas)
    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    search = normalize(search);

    if (!search || !this.searchable()) {
      return options;
    }

    // Filtrado local usando los campos configurados y normalización
    return options.filter((option) => {
      return config.searchFields!.some((field) => {
        const fieldValue = option[field];
        const normValue =
          fieldValue !== null && fieldValue !== undefined ? normalize(String(fieldValue)) : '';
        return normValue.includes(search);
      });
    });
  });

  // Computed para el texto mostrado
  displayText = computed(() => {
    const selected = this.selectedOption();
    const getLabel = this.getOptionLabel();

    if (!selected) {
      return this.placeholder();
    }

    if (Array.isArray(selected)) {
      if (selected.length === 0) return this.placeholder();
      if (selected.length === 1) return getLabel(selected[0]);
      return `${selected.length} elementos seleccionados`;
    }

    return getLabel(selected);
  });

  // Computed para verificar si hay selección
  hasSelection = computed(() => {
    const selected = this.selectedOption();
    return selected && (Array.isArray(selected) ? selected.length > 0 : true);
  });

  constructor() {
    // Effect para sincronizar el valor inicial
    effect(() => {
      const value = this.value();
      const options = this.options();

      if (value !== null && options.length > 0) {
        this.updateSelectedFromValue(value);
      }
    });

    // Effect para emitir búsqueda externa solo si no hay resultados locales
    effect(() => {
      const search = this.searchTerm();
      const filtered = this.filteredOptions();

      // Solo emitir si la búsqueda es activa, no hay resultados locales y es searchable
      if (
        search &&
        search.length >= 2 &&
        this.searchable() &&
        Array.isArray(filtered) &&
        filtered.length === 0
      ) {
        // Esperar un pequeño delay para evitar emitir demasiado rápido
        setTimeout(() => {
          // Solo emitir si el término de búsqueda sigue igual y sigue sin resultados locales
          if (
            this.searchTerm() === search &&
            Array.isArray(this.filteredOptions()) &&
            this.filteredOptions().length === 0
          ) {
            this.searchChange.emit(search);
          }
        }, 300);
      }
    });

    // Effect para sincronizar con reactive forms
    effect(() => {
      const selectedOption = this.selectedOption();
      const getValue = this.getOptionValue();

      let newValue: unknown;
      if (this.multiple()) {
        newValue = Array.isArray(selectedOption) ? selectedOption.map((opt) => getValue(opt)) : [];
      } else {
        newValue =
          selectedOption && !Array.isArray(selectedOption) ? getValue(selectedOption) : null;
      }

      // Solo emitir si el valor cambió
      if (this._value !== newValue) {
        this._value = newValue;
        this._onChange(newValue);
        this.valueChange.emit(newValue);
      }
    });
  }

  ngOnInit() {
    // Configurar listener para clicks fuera del componente
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  private updateSelectedFromValue(value: unknown) {
    const options = this.options();
    const getValue = this.getOptionValue();

    if (this.multiple()) {
      if (Array.isArray(value)) {
        const selected = options.filter((opt) => value.includes(getValue(opt)));
        this.selectedOption.set(selected);
      }
    } else {
      const selected = options.find((opt) => getValue(opt) === value);
      this.selectedOption.set(selected || null);
    }
  }

  // Computed para verificar si está deshabilitado (input + reactive forms)
  isDisabled = computed(() => this.disabled() || this._disabled);

  toggleDropdown() {
    if (this.isDisabled()) return;

    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen.set(true);
    this.opened.emit();

    // Focus en el input de búsqueda
    setTimeout(() => {
      const input = this.searchInput()?.nativeElement;
      if (input && this.searchable()) {
        input.focus();
      }
    }, 0);
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.highlightedIndex.set(-1);
    this.closed.emit();

    // Marcar como touched para formularios reactivos
    this._onTouched();
  }

  selectOption(option: SelectOption) {
    const getDisabled = this.getOptionDisabled();
    const getValue = this.getOptionValue();

    if (getDisabled(option)) return;

    if (this.multiple()) {
      const selected = (this.selectedOption() as SelectOption[]) || [];
      const optionValue = getValue(option);
      const index = selected.findIndex((s) => getValue(s) === optionValue);

      if (index > -1) {
        // Deseleccionar
        const newSelected = selected.filter((s) => getValue(s) !== optionValue);
        this.selectedOption.set(newSelected);
        this.valueChange.emit(newSelected.map((s) => getValue(s)));
      } else {
        // Seleccionar
        const newSelected = [...selected, option];
        this.selectedOption.set(newSelected);
        this.valueChange.emit(newSelected.map((s) => getValue(s)));
      }
    } else {
      this.selectedOption.set(option);
      this.valueChange.emit(getValue(option));
      this.closeDropdown();
    }
  }

  isSelected(option: SelectOption): boolean {
    const selected = this.selectedOption();
    const getValue = this.getOptionValue();
    const optionValue = getValue(option);

    if (!selected) return false;

    if (Array.isArray(selected)) {
      return selected.some((s) => getValue(s) === optionValue);
    }

    return getValue(selected) === optionValue;
  }

  clearSelection() {
    this.selectedOption.set(this.multiple() ? [] : null);
    this.valueChange.emit(this.multiple() ? [] : null);
    this.cleared.emit();
  }

  // Métodos para las clases CSS dinámicas
  getTriggerClasses(): string {
    const baseClasses =
      'bg-base border-base-300 text-neutral-800 dark:bg-base dark:border-base-200 dark:text-white';
    const hoverClasses = 'hover:border-base-400 hover:shadow-sm';
    const focusClasses = 'focus:border-primary-500 focus:ring-2 focus:ring-primary-300';
    const openClasses = this.isOpen() ? 'border-primary-500 ring-2 ring-primary-300' : '';
    const disabledClasses = this.isDisabled()
      ? 'bg-base-100 cursor-not-allowed dark:bg-base-100'
      : '';

    return `${baseClasses} ${this.isDisabled() ? disabledClasses : `${hoverClasses} ${focusClasses}`} ${openClasses}`.trim();
  }

  getOptionClasses(option: SelectOption, index: number): string {
    const baseClasses = 'text-neutral-800 dark:text-white';
    const hoverClasses = 'hover:bg-base-100 dark:hover:bg-base-100';
    const highlightedClasses =
      this.highlightedIndex() === index ? 'bg-base-200 dark:bg-base-200' : '';
    const selectedClasses = this.isSelected(option)
      ? 'bg-primary-50 text-primary-600 font-medium dark:bg-primary-500 dark:text-white'
      : '';
    const disabledClasses = this.getOptionDisabled()(option)
      ? 'opacity-50 cursor-not-allowed text-neutral-400'
      : '';

    return `${baseClasses} ${disabledClasses || `${hoverClasses} ${highlightedClasses} ${selectedClasses}`}`.trim();
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.highlightedIndex.set(-1);
  }

  onKeyDown(event: KeyboardEvent) {
    const filtered = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        } else {
          const newIndex = Math.min(this.highlightedIndex() + 1, filtered.length - 1);
          this.highlightedIndex.set(newIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          const newIndex = Math.max(this.highlightedIndex() - 1, -1);
          this.highlightedIndex.set(newIndex);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen()) {
          const highlightedIndex = this.highlightedIndex();
          if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
            this.selectOption(filtered[highlightedIndex]);
          }
        } else {
          this.openDropdown();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  private handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const selectElement = target.closest('sga-select');

    if (!selectElement && this.isOpen()) {
      this.closeDropdown();
    }
  }

  // ============================================
  // IMPLEMENTACIÓN DE ControlValueAccessor
  // ============================================

  writeValue(value: unknown): void {
    this._value = value;
    this.updateSelectedFromValue(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  // ============================================
  // IMPLEMENTACIÓN DE Validator
  // ============================================

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) {
      return null;
    }

    const value = control.value;

    if (this.multiple()) {
      // Para selección múltiple, verificar que hay al menos un elemento
      return !value || !Array.isArray(value) || value.length === 0 ? { required: true } : null;
    } else {
      // Para selección simple, verificar que no sea null/undefined
      return value === null || value === undefined ? { required: true } : null;
    }
  }

  // ============================================
  // MÉTODOS HELPER PARA AMBOS MODOS DE USO
  // ============================================

  /**
   * Método para uso programático - permite establecer valor desde el padre
   */
  setValue(value: unknown): void {
    this.writeValue(value);
    this._onChange(value);
    this.valueChange.emit(value);
  }

  /**
   * Método para obtener el valor actual
   */
  getValue(): unknown {
    return this._value;
  }

  /**
   * Método para verificar si el componente está en un estado válido
   */
  isValid(): boolean {
    if (!this.required()) return true;

    if (this.multiple()) {
      return Array.isArray(this._value) && this._value.length > 0;
    } else {
      return this._value !== null && this._value !== undefined;
    }
  }

  showAddButtonFn() {
    return this.showAddButton();
  }

  emitAddRequested(term: string) {
    this.addRequested.emit(term);
  }
}
