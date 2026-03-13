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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SectionApi } from '@features/organization/sections/services/api/section-api';
import type { Section } from '@features/organization/sections/types/section-types';

function getSectionLabel(s: Section): string {
  return s.name ?? s.id;
}

function getSectionSubtitle(s: Section): string {
  const parts: string[] = [];
  if (s.shift) parts.push(s.shift);
  if (s.capacity != null) parts.push(String(s.capacity));
  return parts.join(' · ');
}

function getSectionInitials(s: Section): string {
  return (s.name ?? s.id).slice(0, 2).toUpperCase();
}

@Component({
  selector: 'sga-section-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SectionSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSelect implements ControlValueAccessor {
  private api = inject(SectionApi);

  placeholder = input<string>('Seleccionar sección');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allSections = signal<Section[]>([]);
  searchTerm = signal('');
  selectedSection = signal<Section | null>(null);
  loading = signal(false);

  filteredSections = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allSections();
    if (!term) return list;
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.shift?.toLowerCase().includes(term) ||
        String(s.capacity ?? '').includes(term)
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getSectionLabel = getSectionLabel;
  getSectionSubtitle = getSectionSubtitle;
  getSectionInitials = getSectionInitials;

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
      this.selectSection(s);
    }
  }

  loadSections() {
    if (this.loading() || this.allSections().length > 0) return;
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        this.allSections.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openDropdown() {
    if (this.effectiveDisabled()) return;
    this.isOpen.set(true);
    this.loadSections();
  }

  closeDropdown() {
    this.isOpen.set(false);
    this._onTouched();
  }

  selectSection(s: Section) {
    this.selectedSection.set(s);
    this._value = s.id;
    this._onChange(s.id);
    this.valueChange.emit(s.id);
    this.closeDropdown();
  }

  clearSelection(e?: Event) {
    e?.stopPropagation();
    this.selectedSection.set(null);
    this._value = null;
    this._onChange(null);
    this.valueChange.emit(null);
  }

  writeValue(id: string | null): void {
    this._value = id;
    if (!id) {
      this.selectedSection.set(null);
      return;
    }
    const found = this.allSections().find((s) => s.id === id);
    if (found) this.selectedSection.set(found);
    else {
      this.api.getById(id).subscribe({
        next: (res) => this.selectedSection.set(res.data ?? null),
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
