import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { SelectOption } from '@/shared/widgets/select-option/select-option';
import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, HostListener, inject, input, output, signal, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import type { SectionCourse } from '@features/section-courses/types/section-course-types';

function getSectionCourseLabel(sc: SectionCourse): string {
  if (sc.course?.name && sc.section?.name) {
    return `${sc.course.name} - ${sc.section.name}`;
  }
  return sc.course?.name ?? sc.section?.name ?? String(sc.id).slice(0, 12) + '...';
}

function getSectionCourseInitials(sc: SectionCourse): string {
  const name = sc.course?.name ?? sc.section?.name ?? sc.id;
  return String(name).slice(0, 2).toUpperCase();
}

function getSectionCourseSubtitle(sc: SectionCourse): string {
  const parts: string[] = [];
  const teacher = sc.teacher as
    | { person?: { firstName?: string; lastName?: string }; teacherCode?: string }
    | undefined;
  if (teacher?.person?.firstName || teacher?.person?.lastName) {
    parts.push(`${teacher.person?.firstName ?? ''} ${teacher.person?.lastName ?? ''}`.trim());
  } else if (teacher?.teacherCode) {
    parts.push(teacher.teacherCode);
  }
  if (sc.modality) parts.push(sc.modality);
  return parts.join(' · ') || '—';
}


@Component({
  selector: 'sga-section-course-select',
  standalone: true,
  imports: [CommonModule, ZardSelectComponent, ZardSelectItemComponent],
  templateUrl: './section-course-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SectionCourseSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCourseSelect implements ControlValueAccessor, OnInit {
  ngOnInit() {
    this.loadItems();
  }

  private api = inject(SectionCourseApi);

  placeholder = input<string>('Seleccionar curso y sección');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();
  /** Emite id y label cuando se selecciona un item (útil para títulos en schedules) */
  selectionChange = output<{ id: string; label: string }>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  allItems = signal<SectionCourse[]>([]);
  searchTerm = signal('');
  selectedItem = signal<SectionCourse | null>(null);
  loading = signal(false);

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allItems();
    if (!term) return list;
    return list.filter(
      (sc) =>
        sc.course?.name?.toLowerCase().includes(term) ||
        sc.section?.name?.toLowerCase().includes(term) ||
        sc.id?.toLowerCase().includes(term),
    );
  });

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};

  getLabel = getSectionCourseLabel;
  getInitials = getSectionCourseInitials;
  getSubtitle = getSectionCourseSubtitle;

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

  onOptionKeyDown(e: KeyboardEvent, sc: SectionCourse) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectItem(sc);
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

  selectItem(sc: SectionCourse) {
    this.selectedItem.set(sc);
    this._value = sc.id;
    this._onChange(sc.id);
    this.valueChange.emit(sc.id);
    const label = getSectionCourseLabel(sc);
    this.selectionChange.emit({ id: sc.id, label });
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
    const found = this.allItems().find((sc) => sc.id === id);
    if (found) {
      this.selectedItem.set(found);
      this.selectionChange.emit({ id: found.id, label: getSectionCourseLabel(found) });
    } else {
      this.api.getById(id).subscribe({
        next: (res) => {
          const item = res ?? null;
          this.selectedItem.set(item);
          if (item) this.selectionChange.emit({ id: item.id, label: getSectionCourseLabel(item) });
        },
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
