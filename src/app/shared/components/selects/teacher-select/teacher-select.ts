import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TeacherApi } from '@features/teachers/services/api/teacher-api';
import type { Teacher } from '@features/teachers/types/teacher-types';

function getTeacherLabel(t: Teacher): string {
  const person = t.person as { firstName?: string; lastName?: string } | undefined;
  if (person?.firstName || person?.lastName) {
    return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || t.teacherCode;
  }
  return t.teacherCode ?? t.specialization ?? t.id;
}

function getTeacherInitials(t: Teacher): string {
  const person = t.person as { firstName?: string; lastName?: string } | undefined;
  if (person?.firstName && person?.lastName) {
    return `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
  }
  if (person?.firstName) return person.firstName.slice(0, 2).toUpperCase();
  return (t.teacherCode ?? t.id).slice(0, 2).toUpperCase();
}

@Component({
  selector: 'sga-teacher-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TeacherSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSelect implements OnInit, OnDestroy, ControlValueAccessor {
  private api = inject(TeacherApi);
  private destroy$ = new Subject<void>();

  placeholder = input<string>('Seleccionar docente');
  disabled = input<boolean>(false);
  valueChange = output<string | null>();

  private _formDisabled = signal(false);
  effectiveDisabled = () => this.disabled() || this._formDisabled();

  listRef = viewChild<ElementRef<HTMLDivElement>>('listRef');
  hostRef = viewChild<ElementRef<HTMLElement>>('hostRef');

  isOpen = signal(false);
  teachers = signal<Teacher[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedTeacher = signal<Teacher | null>(null);
  page = signal(1);
  hasMore = signal(true);
  total = signal(0);

  private _value: string | null = null;
  private _onChange: (value: string | null) => void = () => {};
  private _onTouched = () => {};
  private searchSubject = new Subject<string>();

  getTeacherLabel = getTeacherLabel;
  getTeacherInitials = getTeacherInitials;

  ngOnInit() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(1);
        this.teachers.set([]);
        this.loadTeachers(1, term);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.searchSubject.next(value);
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

  onOptionKeyDown(e: KeyboardEvent, t: Teacher) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectTeacher(t);
    }
  }

  loadTeachers(page: number, search?: string) {
    if (this.loading()) return;
    this.loading.set(true);
    this.api.getAll({ page, size: 15, search: search || undefined }).subscribe({
      next: (res) => {
        const data = res.data ?? [];
        const current = page === 1 ? data : [...this.teachers(), ...data];
        this.teachers.set(current);
        this.hasMore.set(current.length < (res.total ?? 0));
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onScroll() {
    const el = this.listRef()?.nativeElement;
    if (!el || !this.hasMore() || this.loading()) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      const next = this.page() + 1;
      this.page.set(next);
      this.loadTeachers(next, this.searchTerm() || undefined);
    }
  }

  openDropdown() {
    if (this.effectiveDisabled()) return;
    this.isOpen.set(true);
    if (this.teachers().length === 0) this.loadTeachers(1);
  }

  closeDropdown() {
    this.isOpen.set(false);
    this._onTouched();
  }

  selectTeacher(t: Teacher) {
    this.selectedTeacher.set(t);
    this._value = t.id;
    this._onChange(t.id);
    this.valueChange.emit(t.id);
    this.closeDropdown();
  }

  clearSelection(e?: Event) {
    e?.stopPropagation();
    this.selectedTeacher.set(null);
    this._value = null;
    this._onChange(null);
    this.valueChange.emit(null);
  }

  writeValue(id: string | null): void {
    this._value = id;
    if (!id) {
      this.selectedTeacher.set(null);
      return;
    }
    const found = this.teachers().find((t) => t.id === id);
    if (found) this.selectedTeacher.set(found);
    else {
      this.api.getById(id).subscribe({
        next: (res) => this.selectedTeacher.set(res.data ?? null),
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
