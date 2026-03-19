import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { SelectOption } from '@/shared/widgets/select-option/select-option';
import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, HostListener, inject, input, output, signal, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SectionApi } from '@features/sections/services/api/section-api';
import type { Section } from '@features/sections/types/section-types';

function getLabel(s: Section): string {
  return s.name ?? s.id;
}

function getSubtitle(s: Section): string {
  const parts: string[] = [];
  if (s.shift) parts.push(s.shift);
  if (s.capacity != null) parts.push(String(s.capacity));
  return parts.join(' · ');
}

function getInitials(s: Section): string {
  return (s.name ?? s.id).slice(0, 2).toUpperCase();
}


@Component({
  selector: 'sga-section-select',
  standalone: true,
  imports: [CommonModule, ZardSelectComponent, ZardSelectItemComponent],
  templateUrl: './section-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SectionSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSelect implements ControlValueAccessor, OnInit {
  ngOnInit() {
    this.loadItems();
  }

  private api = inject(SectionApi);

  placeholder = input<string>('Seleccionar sección');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allItems = signal<Section[]>([]);
  searchTerm = signal('');
  selectedItem = signal<Section | null>(null);
  loading = signal(false);

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allItems();
    if (!term) return list;
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.shift?.toLowerCase().includes(term) ||
        String(s.capacity ?? '').includes(term),
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getLabel = getLabel;
  getSubtitle = getSubtitle;
  getInitials = getInitials;

  onSearchInput(e: Event) {
    this.searchTerm.set((e.target as HTMLInputElement).value);
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

  onOptionKeyDown(e: KeyboardEvent, s: Section) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectItem(s);
    }
  }

  loadItems() {
    if (this.loading() || this.allItems().length > 0) return;
    this.loading.set(true);
    this.api.getAll().subscribe({
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

  closeDropdown() {
    this.isOpen.set(false);
    this._onTouched();
  }

  selectItem(s: Section) {
    this.selectedItem.set(s);
    this._value = s.id;
    this._onChange(s.id);
    this.valueChange.emit(s.id);
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
    const found = this.allItems().find((s) => s.id === id);
    if (found) this.selectedItem.set(found);
    else {
      this.api.getById(id).subscribe({
        next: (res) => this.selectedItem.set(res.data ?? null),
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
