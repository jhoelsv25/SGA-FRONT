import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StudentApi } from '@features/students/services/api/student-api';
import type { Student } from '@features/students/types/student-types';
import { ZardInputDirective } from '@/shared/components/input';

function getLabel(student: Student): string {
  return (
    `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() ||
    student.studentCode ||
    student.id
  );
}

function getInitials(student: Student): string {
  const fullName = getLabel(student);
  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'ST'
  );
}

function getSubtitle(student: Student): string {
  const parts = [student.grade, student.docNumber].filter(Boolean);
  return parts.join(' · ') || 'Estudiante';
}

@Component({
  selector: 'sga-student-select',

  imports: [
    CommonModule,
    FormsModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
  ],
  templateUrl: './student-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StudentSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSelect implements ControlValueAccessor {
  private readonly api = inject(StudentApi);
  private readonly searchSubject = new Subject<string>();

  readonly placeholder = input<string>('Seleccionar estudiante');
  readonly disabled = input<boolean>(false);
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly zValue = model<string>('');
  readonly formDisabled = signal(false);
  readonly items = signal<Student[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);
  readonly searchTerm = signal('');
  readonly selectedItem = signal<Student | null>(null);
  readonly page = signal(1);

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    this.searchSubject.pipe(debounceTime(280), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm.set(term);
      this.page.set(1);
      this.hasMore.set(true);
      this.loadItems(true);
    });

    effect(() => {
      const externalValue = this.value();
      if (externalValue !== undefined) {
        this.writeValue(externalValue);
      }
    });
  }

  getLabel = getLabel;
  getInitials = getInitials;
  getSubtitle = getSubtitle;

  writeValue(value: string | null): void {
    const normalized = value ?? '';
    this.zValue.set(normalized);

    if (!value) {
      this.selectedItem.set(null);
      return;
    }

    const current = this.items().find((item) => item.id === value);
    if (current) {
      this.selectedItem.set(current);
      return;
    }

    this.api.getById(value).subscribe({
      next: (response) => {
        const student = response.data ?? null;
        if (!student) return;
        this.selectedItem.set(student);
        this.items.update((items) =>
          items.some((item) => item.id === student.id) ? items : [student, ...items],
        );
      },
    });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  onOpenChange(): void {
    if (!this.items().length && !this.loading()) {
      this.loadItems(true);
    }
  }

  onSearch(value: string): void {
    this.searchSubject.next(value ?? '');
  }

  onSelectionChange(value: string | string[]): void {
    const id = Array.isArray(value) ? value[0] : value;
    if (!id) {
      this.zValue.set('');
      this.selectedItem.set(null);
      this.onChange(null);
      this.valueChange.emit(null);
      return;
    }

    const student = this.items().find((item) => item.id === id) ?? null;
    this.zValue.set(id);
    this.selectedItem.set(student);
    this.onChange(id);
    this.valueChange.emit(id);
    this.onTouched();
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore() || this.loading()) return;
    this.page.update((page) => page + 1);
    this.loadItems(false);
  }

  private loadItems(reset: boolean): void {
    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const currentPage = reset ? 1 : this.page();
    this.api
      .getAll({ page: currentPage, size: 20, search: this.searchTerm() || undefined })
      .subscribe({
        next: (response) => {
          const incoming = response.data ?? [];
          const nextItems = reset ? incoming : [...this.items(), ...incoming];
          this.items.set(nextItems);
          this.hasMore.set(nextItems.length < (response.total ?? nextItems.length));
          if (reset) {
            this.page.set(1);
          }
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }
}
