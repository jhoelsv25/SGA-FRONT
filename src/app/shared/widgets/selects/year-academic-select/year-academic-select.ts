import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { YearAcademicApi } from '@features/year-academic/services/api/year-academic-api';
import type { YearAcademic } from '@features/year-academic/types/year-academi-types';
import { ZardInputDirective } from '@/shared/components/input';

function getLabel(y: YearAcademic): string {
  return y.name ?? String(y.year ?? y.id);
}

function getInitials(y: YearAcademic): string {
  return String(y.year ?? y.name ?? y.id)
    .slice(0, 2)
    .toUpperCase();
}

function getSubtitle(y: YearAcademic): string {
  const parts = [y.status, y.startDate, y.endDate].filter(Boolean);
  return parts.join(' · ') || 'Año académico';
}

@Component({
  selector: 'sga-year-academic-select',

  imports: [
    CommonModule,
    FormsModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
  ],
  templateUrl: './year-academic-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => YearAcademicSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearAcademicSelect implements ControlValueAccessor, OnInit {
  ngOnInit() {
    this.loadItems();
  }

  private api = inject(YearAcademicApi);

  placeholder = input<string>('Seleccionar año académico');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allItems = signal<YearAcademic[]>([]);
  searchTerm = signal('');
  selectedItem = signal<YearAcademic | null>(null);
  loading = signal(false);

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allItems();
    if (!term) return list;
    return list.filter(
      (y) =>
        y.name?.toLowerCase().includes(term) ||
        String(y.year ?? '').includes(term) ||
        String(y.status ?? '')
          .toLowerCase()
          .includes(term),
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getLabel = getLabel;
  getInitials = getInitials;
  getSubtitle = getSubtitle;

  onSearchInput(value: string) {
    this.searchTerm.set(value ?? '');
  }

  onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.isOpen()) this.closeDropdown();
      else this.openDropdown();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closeDropdown();
    }
  }

  onOptionKeyDown(e: KeyboardEvent, y: any) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectItem(y);
    }
  }

  onZardSelectionChange(val: string | string[]) {
    const id = Array.isArray(val) ? val[0] : val;
    if (!id) {
      this.clearSelection();
      return;
    }
    const found = this.allItems().find((x) => x.id === id);
    if (found) {
      this.selectItem(found);
    } else {
      this.writeValue(id);
    }
  }

  loadItems() {
    if (this.loading() || this.allItems().length > 0) return;
    this.loading.set(true);
    this.api.getAll({}).subscribe({
      next: (res) => {
        this.allItems.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openDropdown() {
    if (this.effectiveDisabled()) return;
    this.isOpen.set(true);
    this.loadItems();
  }

  closeDropdown() {
    this.isOpen.set(false);
    this._onTouched();
  }

  selectItem(y: YearAcademic) {
    this.selectedItem.set(y);
    this._value = y.id;
    this._onChange(y.id);
    this.valueChange.emit(y.id);
    this.closeDropdown();
  }

  clearSelection(e?: Event) {
    e?.stopPropagation();
    this.selectedItem.set(null);
    this._value = null;
    this._onChange(null);
    this.valueChange.emit(null);
  }

  writeValue(id: string | null): void {
    this._value = id;
    if (!id) {
      this.selectedItem.set(null);
      return;
    }
    const found = this.allItems().find((y) => y.id === id);
    if (found) this.selectedItem.set(found);
    else {
      this.api.getById(id).subscribe({
        next: (res) => this.selectedItem.set(res ?? null),
      });
    }
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._formDisabled.set(isDisabled);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.isOpen()) return;
    const host = this.hostRef()?.nativeElement;
    if (host && !host.contains(e.target as Node)) this.closeDropdown();
  }
}
