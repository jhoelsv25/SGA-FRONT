import { HttpClient } from '@angular/common/http';
import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { ChangeDetectionStrategy, Component, effect, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ZardInputDirective } from '@/shared/components/input';

type PersonOption = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  documentNumber?: string;
  photoUrl?: string;
};

function getLabel(item: PersonOption): string {
  return `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email || item.documentNumber || item.id;
}

function getInitials(item: PersonOption): string {
  return (
    getLabel(item)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'PE'
  );
}

function getSubtitle(item: PersonOption): string {
  return [item.email, item.documentNumber].filter(Boolean).join(' · ') || 'Persona';
}

@Component({
  selector: 'sga-person-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  templateUrl: './person-select.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PersonSelect), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonSelect implements ControlValueAccessor {
  private readonly http = inject(HttpClient);
  private readonly searchSubject = new Subject<string>();

  readonly placeholder = input<string>('Seleccionar persona');
  readonly disabled = input<boolean>(false);
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly zValue = model<string>('');
  readonly formDisabled = signal(false);
  readonly items = signal<PersonOption[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly selectedItem = signal<PersonOption | null>(null);

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
    this.http.get<{ data?: PersonOption }>(`persons/${value}`).subscribe({
      next: (response) => {
        const item = response.data ?? null;
        this.selectedItem.set(item);
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
    const item = this.items().find((current) => current.id === id) ?? null;
    this.zValue.set(id);
    this.selectedItem.set(item);
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

    const page = reset ? 1 : this.page();
    this.http.get<{ data?: PersonOption[]; total?: number }>('persons', {
      params: {
        page,
        size: 20,
        ...(this.searchTerm() ? { search: this.searchTerm() } : {}),
      } as any,
    }).subscribe({
      next: (response) => {
        const incoming = response.data ?? [];
        const nextItems = reset ? incoming : [...this.items(), ...incoming];
        this.items.set(nextItems);
        this.hasMore.set(nextItems.length < (response.total ?? nextItems.length));
        if (reset) this.page.set(1);
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
