import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import type { Institution } from '@features/institution/types/institution-types';
import { ZardInputDirective } from '@/shared/components/input';

function getLabel(item: Institution): string {
  return item.name || item.modularCode || item.id;
}

function getInitials(item: Institution): string {
  return (item.name || item.modularCode || item.id).slice(0, 2).toUpperCase();
}

function getSubtitle(item: Institution): string {
  return [item.district, item.province, item.department].filter(Boolean).join(' · ') || item.address || 'Institución';
}

@Component({
  selector: 'sga-institution-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  templateUrl: './institution-select.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InstitutionSelect), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionSelect implements ControlValueAccessor {
  private readonly api = inject(InstitutionApi);

  readonly placeholder = input<string>('Seleccionar institución');
  readonly disabled = input<boolean>(false);
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly zValue = model<string>('');
  readonly formDisabled = signal(false);
  readonly items = signal<Institution[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedItem = signal<Institution | null>(null);

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    return this.items().filter((item) =>
      [item.name, item.modularCode, item.address, item.district, item.province, item.department]
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
    this.zValue.set(value ?? '');
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
    if (!this.items().length && !this.loading()) {
      this.loading.set(true);
      this.api.getAll({}).subscribe({
        next: (items) => {
          this.items.set(items ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch(value: string): void {
    this.searchTerm.set(value ?? '');
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

    const item = this.items().find((current) => current.id === id) ?? null;
    this.zValue.set(id);
    this.selectedItem.set(item);
    this.onChange(id);
    this.valueChange.emit(id);
    this.onTouched();
  }
}
