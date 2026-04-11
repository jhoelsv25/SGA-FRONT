import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GuardianApi } from '@features/students/services/api/guardian-api';
import type { Guardian } from '@features/students/types/guardian-types';
import { ZardInputDirective } from '@/shared/components/input';

function getLabel(item: Guardian): string {
  const name = `${item.person?.firstName ?? ''} ${item.person?.lastName ?? ''}`.trim();
  return name || item.occupation || item.id;
}

function getInitials(item: Guardian): string {
  return (
    getLabel(item)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'AP'
  );
}

function getSubtitle(item: Guardian): string {
  return (
    [item.relationship, item.occupation, item.person?.email].filter(Boolean).join(' · ') ||
    'Apoderado'
  );
}

@Component({
  selector: 'sga-guardian-select',

  imports: [
    CommonModule,
    FormsModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
  ],
  templateUrl: './guardian-select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GuardianSelect), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardianSelect implements ControlValueAccessor {
  private readonly api = inject(GuardianApi);

  readonly placeholder = input<string>('Seleccionar apoderado');
  readonly disabled = input<boolean>(false);
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly zValue = model<string>('');
  readonly formDisabled = signal(false);
  readonly items = signal<Guardian[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedItem = signal<Guardian | null>(null);

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
          this.items.update((items) =>
            items.some((current) => current.id === item.id) ? items : [item, ...items],
          );
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
        next: (response) => {
          this.items.set(response.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch(value: string): void {
    this.searchTerm.set(value ?? '');
  }

  filteredItems() {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.items();
    return this.items().filter((item) =>
      [
        item.person?.firstName,
        item.person?.lastName,
        item.person?.email,
        item.relationship,
        item.occupation,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
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
