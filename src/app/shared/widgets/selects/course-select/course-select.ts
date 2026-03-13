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
import { CourseApi } from '@features/academic-setup/courses/services/course-api';
import type { Course } from '@features/academic-setup/courses/types/course-types';

function getCourseLabel(c: Course): string {
  return `${c.code} - ${c.name}`;
}

function getCourseInitials(c: Course): string {
  return (c.code ?? c.name ?? c.id).slice(0, 2).toUpperCase();
}

@Component({
  selector: 'sga-course-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CourseSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseSelect implements ControlValueAccessor {
  private api = inject(CourseApi);

  placeholder = input<string>('Seleccionar curso');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allItems = signal<Course[]>([]);
  searchTerm = signal('');
  selectedItem = signal<Course | null>(null);
  loading = signal(false);

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allItems();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getLabel = getCourseLabel;
  getInitials = getCourseInitials;

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

  onOptionKeyDown(e: KeyboardEvent, c: Course) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectItem(c);
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

  closeDropdown() {
    this.isOpen.set(false);
    this._onTouched();
  }

  selectItem(c: Course) {
    this.selectedItem.set(c);
    this._value = c.id;
    this._onChange(c.id);
    this.valueChange.emit(c.id);
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
    const found = this.allItems().find((c) => c.id === id);
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
