import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-list-toolbar',
  standalone: true,
  imports: [Button],
  template: `
    <div
      class="w-full rounded-4xl bg-base-100/75 backdrop-blur-md p-4 md:p-5 shadow-[0_14px_36px_-22px_rgba(15,23,42,0.38)] overflow-visible mb-2 md:mb-3"
    >
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-visible w-full">
        @if (title()) {
          <div class="flex items-center gap-4 shrink-0 px-1">
            @if (icon()) {
              <div
                class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner"
              >
                <i [class]="icon()" class="text-xl"></i>
              </div>
            }
            <div>
              <h1 class="text-lg md:text-xl font-bold text-base-content uppercase tracking-tight">
                {{ title() }}
              </h1>
              @if (description()) {
                <p class="text-sm text-base-content/50 mt-0.5">{{ description() }}</p>
              }
            </div>
          </div>
        }

        <div
          class="flex flex-wrap items-center gap-3 md:gap-4 flex-1 lg:justify-end min-w-0 relative z-10 overflow-visible w-full"
        >
          <!-- Buscador -->
          @if (showSearch()) {
            <div class="relative flex-1 min-w-[180px] max-w-sm group">
              <div
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/45 pointer-events-none transition-colors"
              >
                <i class="fas fa-search text-sm"></i>
              </div>
              <input
                type="text"
                class="w-full pl-10 pr-10 py-2.5 rounded-4xl border border-base-200/85 bg-base-100/75 backdrop-blur-md text-sm focus:outline-none focus:ring-0 focus:border-base-300 transition-all placeholder:text-base-content/40 hover:border-base-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                [placeholder]="searchPlaceholder()"
                [value]="searchValue()"
                (input)="onSearchInput($event)"
                (keydown.enter)="applySearchImmediate()"
              />
              @if (searchValue()) {
                <button
                  sgaButton
                  shape="pill"
                  variant="ghost"
                  color="secondary"
                  size="sm"
                  title="Limpiar"
                  (click)="clearSearch()"
                >
                  <i class="fas fa-times"></i>
                </button>
              }
            </div>
          }

          <div class="flex items-center gap-2">
            @if (showFilter()) {
              <button
                sgaButton
                shape="pill"
                variant="ghost"
                color="secondary"
                size="sm"
                type="button"
                class="relative shrink-0"
                title="Filtros"
                (click)="toggleFilters()"
              >
                <i class="fas fa-sliders-h text-sm"></i>
                @if (filterCount() > 0) {
                  <span
                    class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-content text-[10px] font-bold"
                  >
                    {{ filterCount() }}
                  </span>
                }
              </button>
            }

            <!-- Refresh -->
            <button
              sgaButton
              shape="pill"
              variant="ghost"
              color="secondary"
              size="sm"
              type="button"
              (click)="refresh.emit()"
              class="shrink-0"
              title="Actualizar"
            >
              <i class="fas fa-sync-alt text-sm"></i>
            </button>
          </div>

          <div class="flex items-center gap-2 empty:hidden">
            <ng-content select="[list-toolbar-actions]"></ng-content>
          </div>
        </div>
      </div>

      @if (showFilter() && filtersOpen()) {
        <div
          class="mt-4 rounded-3xl bg-base-200/45 p-4 md:p-5 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <ng-content select="[list-toolbar-filter]"></ng-content>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbar implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

  title = input<string>('');
  icon = input<string>('');
  description = input<string>('');
  searchPlaceholder = input<string>('Buscar...');
  showSearch = input<boolean>(true);
  showFilter = input<boolean>(true);
  filterCount = input<number>(0);

  searchParamKey = input<string>('search');
  useSearchParams = input<boolean>(true);
  debounceMs = input<number>(400);

  searchChange = output<string>();
  refresh = output<void>();

  protected searchValue = signal('');
  protected filtersOpen = signal(false);

  constructor() {
    const debounce = this.debounceMs() || 400;
    this.searchSubject
      .pipe(debounceTime(debounce), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchChange.emit(value);
        if (this.useSearchParams()) {
          this.router.navigate([], {
            queryParams: { [this.searchParamKey()]: value || null },
            queryParamsHandling: 'merge',
          });
        }
      });
  }

  ngOnInit(): void {
    if (this.useSearchParams()) {
      const paramKey = this.searchParamKey();
      const initial = this.route.snapshot.queryParamMap.get(paramKey) ?? '';
      this.searchValue.set(initial);
      this.searchChange.emit(initial);

      this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        const value = params[paramKey] ?? '';
        if (value !== this.searchValue()) {
          this.searchValue.set(value);
          this.searchChange.emit(value);
        }
      });
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  applySearchImmediate(): void {
    const value = this.searchValue();
    this.searchChange.emit(value);
    if (this.useSearchParams()) {
      this.router.navigate([], {
        queryParams: { [this.searchParamKey()]: value || null },
        queryParamsHandling: 'merge',
      });
    }
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.searchSubject.next('');
    this.searchChange.emit('');
    if (this.useSearchParams()) {
      this.router.navigate([], {
        queryParams: { [this.searchParamKey()]: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  toggleFilters(): void {
    this.filtersOpen.update((v) => !v);
  }
}
