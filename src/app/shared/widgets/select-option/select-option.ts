import { Component, input, output, model, forwardRef, ChangeDetectionStrategy, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
  meta?: string;
  code?: string;
  badge?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  searchText?: string;
}

@Component({
  selector: 'z-select-option',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardInputDirective],
  template: `
    <z-select
      [zPlaceholder]="placeholder()"
      [zDisabled]="disabled()"
      [(zValue)]="zValue"
      (zSelectionChange)="onValueChange($event)"
      [zCanLoadMore]="canLoadMore()"
      (zScrolledToEnd)="onLoadMore()"
      [class]="customClass()"
    >
      @if (searchable()) {
      <div class="sticky top-0 z-10 border-b border-border/50 bg-popover p-2">
        <input
          z-input
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar..."
          class="w-full"
        />
      </div>
      }
      @for (option of filteredOptions(); track option.value) {
        <z-select-item [zValue]="String(option.value)" [zDisabled]="option.disabled">
          <div class="flex min-w-0 items-center gap-3 py-0.5">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              @if (option.avatarUrl) {
                <img [src]="option.avatarUrl" [alt]="option.label" class="h-full w-full object-cover" />
              } @else {
                {{ getAvatarFallback(option) }}
              }
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span data-select-label class="truncate text-sm font-semibold text-foreground">
                  {{ option.label }}
                </span>
                @if (option.badge) {
                  <span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {{ option.badge }}
                  </span>
                }
              </div>

              @if (option.description || option.meta) {
                <div class="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  @if (option.description) {
                    <span class="truncate">{{ option.description }}</span>
                  }
                  @if (option.description && option.meta) {
                    <span class="shrink-0 text-[10px]">•</span>
                  }
                  @if (option.meta) {
                    <span class="truncate">{{ option.meta }}</span>
                  }
                </div>
              }
            </div>

            @if (option.code) {
              <span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {{ option.code }}
              </span>
            }
          </div>
        </z-select-item>
      }
      @if (!filteredOptions().length && !loadingMore()) {
        <z-select-item zValue="__empty__" [zDisabled]="true">
          Sin resultados
        </z-select-item>
      }
      @if (loadingMore()) {
        <z-select-item zValue="__loading__" [zDisabled]="true">
          Cargando más...
        </z-select-item>
      }
    </z-select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectOptionComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOptionComponent implements ControlValueAccessor {
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input<string>('Seleccione...');
  readonly disabled = input<boolean>(false);
  readonly searchable = input<boolean>(true);
  readonly customClass = input<string>('');
  readonly canLoadMore = input<boolean>(false);
  readonly loadingMore = input<boolean>(false);
  
  // Legacy compatibility inputs/outputs
  readonly value = input<any>(null);
  readonly valueChange = output<any>();
  readonly loadMore = output<void>();
  
  zValue = model<any>('');
  searchTerm = signal('');
  filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.options();
    return this.options().filter((option) => this.matchesSearch(option, term));
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined && v !== null) {
        this.zValue.set(String(v));
      }
    });
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  String = String;

  writeValue(val: any): void {
    this.zValue.set(val === undefined || val === null ? '' : String(val));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handled by input
  }

  onValueChange(val: any) {
    const normalized = val === undefined || val === null ? '' : String(val);
    this.zValue.set(normalized);
    this.onChange(normalized);
    this.valueChange.emit(normalized);
  }

  onLoadMore() {
    if (this.canLoadMore() && !this.loadingMore()) {
      this.loadMore.emit();
    }
  }

  onSearch(value: string) {
    this.searchTerm.set(value ?? '');
  }

  getAvatarFallback(option: SelectOption): string {
    if (option.avatarFallback?.trim()) {
      return option.avatarFallback.trim().slice(0, 2).toUpperCase();
    }

    return option.label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'NA';
  }

  private matchesSearch(option: SelectOption, term: string): boolean {
    const content = [
      option.label,
      option.description,
      option.meta,
      option.code,
      option.badge,
      option.searchText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return content.includes(term);
  }
}
