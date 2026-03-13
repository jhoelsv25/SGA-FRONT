import {
  Component,
  signal,
  input,
  output,
  computed,
  effect,
  forwardRef,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

// Providers para formularios reactivos
const VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DatePicker),
  multi: true,
};

const NG_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => DatePicker),
  multi: true,
};

@Component({
  selector: 'sga-date-picker',
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
  providers: [VALUE_ACCESSOR, NG_VALIDATOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePicker implements ControlValueAccessor, Validator {
  // Inputs
  placeholder = input<string>('Seleccionar fecha...');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  rangeMode = input<boolean>(false); // false = single date, true = date range
  minDate = input<Date | string | null>(null);
  maxDate = input<Date | string | null>(null);
  value = input<Date | DateRange | string | null>(null);
  clearable = input<boolean>(true);

  // Outputs
  valueChange = output<Date | DateRange | null>();
  opened = output<void>();
  closed = output<void>();
  cleared = output<void>();

  // Internal signals
  isOpen = signal<boolean>(false);
  currentMonth = signal<Date>(new Date());
  selectedDate = signal<Date | null>(null);
  selectedRange = signal<DateRange>({ start: null, end: null });
  hoveredDate = signal<Date | null>(null);

  // ControlValueAccessor
  private _value: Date | DateRange | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _onChange = (_value: Date | DateRange | null) => {};
  private _onTouched = () => {};
  private _disabled = false;

  // Computed
  isDisabled = computed(() => this.disabled() || this._disabled);

  // Computed para parsear min/max dates
  minDateParsed = computed(() => {
    const min = this.minDate();
    if (!min) return null;
    return typeof min === 'string' ? parseISO(min) : min;
  });

  maxDateParsed = computed(() => {
    const max = this.maxDate();
    if (!max) return null;
    return typeof max === 'string' ? parseISO(max) : max;
  });

  // Computed para el display text
  displayText = computed(() => {
    if (this.rangeMode()) {
      const range = this.selectedRange();
      if (!range.start && !range.end) {
        return this.placeholder();
      }
      const startText = range.start ? format(range.start, 'dd/MM/yyyy', { locale: es }) : '...';
      const endText = range.end ? format(range.end, 'dd/MM/yyyy', { locale: es }) : '...';
      return `${startText} - ${endText}`;
    } else {
      const date = this.selectedDate();
      return date ? format(date, 'dd/MM/yyyy', { locale: es }) : this.placeholder();
    }
  });

  // Computed para verificar si hay selección
  hasSelection = computed(() => {
    if (this.rangeMode()) {
      const range = this.selectedRange();
      return !!(range.start || range.end);
    }
    return !!this.selectedDate();
  });

  // Computed para el mes/año actual
  currentMonthYear = computed(() => {
    return format(this.currentMonth(), 'MMMM yyyy', { locale: es });
  });

  // Computed para los días del calendario
  calendarDays = computed(() => {
    const month = this.currentMonth();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const days: Date[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  });

  // Días de la semana
  weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  constructor() {
    // Effect para sincronizar el valor inicial
    effect(() => {
      const value = this.value();
      if (value) {
        this.updateSelectedFromValue(value);
      }
    });
  }

  // ============================================
  // MÉTODOS DE NAVEGACIÓN
  // ============================================

  previousMonth() {
    this.currentMonth.set(subMonths(this.currentMonth(), 1));
  }

  nextMonth() {
    this.currentMonth.set(addMonths(this.currentMonth(), 1));
  }

  goToToday() {
    this.currentMonth.set(new Date());
  }

  // ============================================
  // MÉTODOS DE SELECCIÓN
  // ============================================

  selectDate(date: Date) {
    if (this.isDisabled() || this.isDateDisabled(date)) return;

    if (this.rangeMode()) {
      this.selectRangeDate(date);
    } else {
      this.selectedDate.set(date);
      this._value = date;
      this._onChange(date);
      this.valueChange.emit(date);
      this.closeCalendar();
    }
  }

  private selectRangeDate(date: Date) {
    const range = this.selectedRange();

    if (!range.start || (range.start && range.end)) {
      // Iniciar nueva selección
      this.selectedRange.set({ start: date, end: null });
    } else {
      // Completar rango
      if (isBefore(date, range.start)) {
        this.selectedRange.set({ start: date, end: range.start });
      } else {
        this.selectedRange.set({ start: range.start, end: date });
      }
      const newRange = this.selectedRange();
      this._value = newRange;
      this._onChange(newRange);
      this.valueChange.emit(newRange);
      this.closeCalendar();
    }
  }

  onDateHover(date: Date) {
    if (this.rangeMode()) {
      this.hoveredDate.set(date);
    }
  }

  clearSelection() {
    if (this.rangeMode()) {
      this.selectedRange.set({ start: null, end: null });
      this._value = null;
    } else {
      this.selectedDate.set(null);
      this._value = null;
    }
    this._onChange(null);
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  // ============================================
  // MÉTODOS DE VISUALIZACIÓN
  // ============================================

  toggleCalendar() {
    if (this.isDisabled()) return;

    if (this.isOpen()) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  openCalendar() {
    this.isOpen.set(true);
    this.opened.emit();
  }

  closeCalendar() {
    this.isOpen.set(false);
    this.hoveredDate.set(null);
    this.closed.emit();
    this._onTouched();
  }

  // ============================================
  // MÉTODOS DE ESTILO Y CLASES
  // ============================================

  isDateInCurrentMonth(date: Date): boolean {
    return isSameMonth(date, this.currentMonth());
  }

  isDateSelected(date: Date): boolean {
    if (this.rangeMode()) {
      const range = this.selectedRange();
      if (!range.start) return false;
      if (!range.end) return isSameDay(date, range.start);
      return (
        isSameDay(date, range.start) ||
        isSameDay(date, range.end) ||
        (isAfter(date, range.start) && isBefore(date, range.end))
      );
    }
    const selected = this.selectedDate();
    return selected ? isSameDay(date, selected) : false;
  }

  isDateInRange(date: Date): boolean {
    if (!this.rangeMode()) return false;
    const range = this.selectedRange();
    if (!range.start || !range.end) {
      // Si estamos seleccionando, usar el hover
      const hovered = this.hoveredDate();
      if (range.start && hovered) {
        const start = isBefore(range.start, hovered) ? range.start : hovered;
        const end = isBefore(range.start, hovered) ? hovered : range.start;
        return isWithinInterval(date, { start, end });
      }
      return false;
    }
    return isWithinInterval(date, { start: range.start, end: range.end });
  }

  isRangeStart(date: Date): boolean {
    if (!this.rangeMode()) return false;
    const range = this.selectedRange();
    return range.start ? isSameDay(date, range.start) : false;
  }

  isRangeEnd(date: Date): boolean {
    if (!this.rangeMode()) return false;
    const range = this.selectedRange();
    return range.end ? isSameDay(date, range.end) : false;
  }

  isDateToday(date: Date): boolean {
    return isToday(date);
  }

  isDateDisabled(date: Date): boolean {
    const min = this.minDateParsed();
    const max = this.maxDateParsed();

    if (min && isBefore(date, min)) return true;
    if (max && isAfter(date, max)) return true;

    return false;
  }

  getDayClasses(date: Date): string {
    const classes: string[] = [
      'w-10',
      'h-10',
      'flex',
      'items-center',
      'justify-center',
      'text-sm',
      'rounded-lg',
      'cursor-pointer',
      'transition-all',
      'duration-200',
    ];

    if (!this.isDateInCurrentMonth(date)) {
      classes.push('text-muted-foreground/50');
    } else {
      classes.push('text-foreground');
    }

    if (this.isDateToday(date) && !this.isDateSelected(date)) {
      classes.push('border-2', 'border-primary', 'font-bold');
    }

    if (this.isDateSelected(date)) {
      if (this.rangeMode()) {
        if (this.isRangeStart(date) || this.isRangeEnd(date)) {
          classes.push('bg-primary', 'text-primary-foreground', 'font-bold');
        } else {
          classes.push('bg-primary/10', 'text-primary');
        }
      } else {
        classes.push('bg-primary', 'text-primary-foreground', 'font-bold');
      }
    } else if (this.isDateInRange(date)) {
      classes.push('bg-primary/10', 'text-primary');
    } else if (!this.isDateDisabled(date)) {
      classes.push('hover:bg-muted');
    }

    if (this.isDateDisabled(date)) {
      classes.push('text-muted-foreground opacity-40', 'cursor-not-allowed', 'hover:bg-transparent');
    }

    return classes.join(' ');
  }

  getTriggerClasses(): string {
    const baseClasses =
      'bg-background border-input text-foreground shadow-sm';
    const hoverClasses = 'hover:border-ring/50 hover:bg-muted/30';
    const focusClasses = 'focus:border-primary focus:ring-2 focus:ring-primary/20';
    const openClasses = this.isOpen() ? 'border-primary ring-2 ring-primary/20' : '';
    const disabledClasses = this.isDisabled()
      ? 'bg-muted cursor-not-allowed opacity-50'
      : '';

    return `${baseClasses} ${this.isDisabled() ? disabledClasses : `${hoverClasses} ${focusClasses}`} ${openClasses}`.trim();
  }

  // ============================================
  // CONTROLVALUEACCESSOR
  // ============================================

  writeValue(value: Date | DateRange | string | null): void {
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      this._value = parsed;
      this.updateSelectedFromValue(parsed);
    } else {
      this._value = value;
      this.updateSelectedFromValue(value);
    }
  }

  registerOnChange(fn: (value: Date | DateRange | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  // ============================================
  // VALIDATOR
  // ============================================

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) {
      return null;
    }

    const value = control.value;

    if (this.rangeMode()) {
      if (!value || typeof value !== 'object' || !value.start || !value.end) {
        return { required: true };
      }
    } else {
      if (!value) {
        return { required: true };
      }
    }

    return null;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private updateSelectedFromValue(value: Date | DateRange | string | null) {
    if (!value) {
      this.selectedDate.set(null);
      this.selectedRange.set({ start: null, end: null });
      return;
    }

    if (this.rangeMode()) {
      if (typeof value === 'object' && 'start' in value && 'end' in value) {
        const start =
          value.start instanceof Date
            ? value.start
            : value.start
              ? parseISO(value.start as string)
              : null;
        const end =
          value.end instanceof Date ? value.end : value.end ? parseISO(value.end as string) : null;
        this.selectedRange.set({ start, end });
      }
    } else {
      const date =
        value instanceof Date ? value : typeof value === 'string' ? parseISO(value) : null;
      this.selectedDate.set(date);
      if (date) {
        this.currentMonth.set(date);
      }
    }
  }

  // Close calendar when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('sga-date-picker');
    if (!clickedInside && this.isOpen()) {
      this.closeCalendar();
    }
  }
}
