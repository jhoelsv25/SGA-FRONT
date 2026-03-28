import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { AssessmentApi } from '@features/assessment-management/services/assessment-api';
import type { Assessment } from '@features/assessment-management/types/assessment-types';

function getLabel(item: Assessment): string {
  return item.name || item.id;
}

function getInitials(item: Assessment): string {
  return (item.name || item.id).slice(0, 2).toUpperCase();
}

function getSubtitle(item: Assessment): string {
  return [
    item.sectionCourse?.course?.name,
    item.period?.name,
    item.competency?.name,
  ]
    .filter(Boolean)
    .join(' · ') || 'Evaluación académica';
}

@Component({
  selector: 'sga-assessment-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  templateUrl: './assessment-select.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AssessmentSelect), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentSelect implements ControlValueAccessor {
  private readonly api = inject(AssessmentApi);

  readonly placeholder = input<string>('Seleccionar evaluación');
  readonly disabled = input<boolean>(false);
  readonly sectionCourseId = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly items = signal<Assessment[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedItem = signal<Assessment | null>(null);
  readonly formDisabled = signal(false);
  readonly value = signal<string>('');

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const currentSectionCourseId = this.sectionCourseId();
    const filteredBySection = currentSectionCourseId
      ? this.items().filter((item) => item.sectionCourse?.id === currentSectionCourseId)
      : this.items();

    if (!term) return filteredBySection;

    return filteredBySection.filter((item) =>
      [
        item.name,
        item.description,
        item.sectionCourse?.course?.name,
        item.period?.name,
        item.competency?.name,
        item.competency?.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  });

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  getLabel = getLabel;
  getInitials = getInitials;
  getSubtitle = getSubtitle;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    if (!value) {
      this.selectedItem.set(null);
      return;
    }
    const found = this.items().find((item) => item.id === value);
    if (found) {
      this.selectedItem.set(found);
      return;
    }
    this.api.getById(value).subscribe({
      next: (item) => {
        this.selectedItem.set(item ?? null);
        if (item) {
          this.items.update((items) => (items.some((current) => current.id === item.id) ? items : [item, ...items]));
        }
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

  onOpen(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.api.getAll({ size: 300 }).subscribe({
      next: (response) => {
        this.items.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value ?? '');
  }

  onSelectionChange(value: string | string[]): void {
    const id = Array.isArray(value) ? value[0] : value;
    if (!id) {
      this.value.set('');
      this.selectedItem.set(null);
      this.onChange(null);
      this.valueChange.emit(null);
      return;
    }

    const item = this.items().find((current) => current.id === id) ?? null;
    this.value.set(id);
    this.selectedItem.set(item);
    this.onChange(id);
    this.valueChange.emit(id);
    this.onTouched();
  }
}
