import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, HostListener, inject, input, output, signal, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GradeLevelApi } from "@features/grade-levels/services/api/grade-level-api";
import type { GradeLevel } from "@features/grade-levels/types/grade-level-types";
import { ZardInputDirective } from '@/shared/components/input';

function getLabel(g: GradeLevel): string {
  return g.name ?? g.id;
}

function getSubtitle(g: GradeLevel): string {
  const parts: string[] = [];
  if (g.level) parts.push(g.level);
  if (g.maxCapacity != null) parts.push(`Cap: ${g.maxCapacity}`);
  return parts.join(' · ');
}

function getInitials(g: GradeLevel): string {
  return (g.name ?? g.id).slice(0, 2).toUpperCase();
}


@Component({
  selector: 'sga-grade-level-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  templateUrl: './grade-level-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GradeLevelSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLevelSelect implements ControlValueAccessor, OnInit {
  ngOnInit() {
    this.loadItems();
  }

  private api = inject(GradeLevelApi);

  placeholder = input<string>('Seleccionar grado / nivel');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allItems = signal<GradeLevel[]>([]);
  searchTerm = signal('');
  selectedItem = signal<GradeLevel | null>(null);
  loading = signal(false);

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allItems();
    if (!term) return list;
    return list.filter(
      (g) =>
        g.name?.toLowerCase().includes(term) ||
        g.level?.toLowerCase().includes(term) ||
        String(g.gradeNumber ?? '').includes(term) ||
        String(g.maxCapacity ?? '').includes(term),
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getLabel = getLabel;
  getSubtitle = getSubtitle;
  getInitials = getInitials;

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

  onOptionKeyDown(e: KeyboardEvent, g: any) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectItem(g);
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
    this.api.getAll().subscribe({
      next: (list) => {
        this.allItems.set(list ?? []);
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

  selectItem(g: GradeLevel) {
    this.selectedItem.set(g);
    this._value = g.id;
    this._onChange(g.id);
    this.valueChange.emit(g.id);
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
    const found = this.allItems().find((g) => g.id === id);
    if (found) this.selectedItem.set(found);
    else {
      this.api.getById(id).subscribe({
        next: (res) => this.selectedItem.set(res?.data ?? null),
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
