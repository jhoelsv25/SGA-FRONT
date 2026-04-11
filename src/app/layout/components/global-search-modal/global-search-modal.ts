import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalSearchApi, GlobalSearchItem } from '@core/services/api/global-search-api';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';

type SearchDialogData = {
  initialQuery?: string;
};

@Component({
  selector: 'sga-global-search-modal',

  imports: [CommonModule, FormsModule, ZardInputDirective, ZardIconComponent],
  templateUrl: './global-search-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GlobalSearchModalComponent implements OnInit, OnDestroy {
  private readonly searchApi = inject(GlobalSearchApi);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(ZardDialogRef<GlobalSearchModalComponent>);
  private readonly data = inject<SearchDialogData>(Z_MODAL_DATA, { optional: true }) ?? {};
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 280;

  readonly query = signal(this.data.initialQuery?.trim() ?? '');
  readonly results = signal<GlobalSearchItem[]>([]);
  readonly loading = signal(false);
  readonly emptyMessage = computed(() =>
    this.query().trim()
      ? 'No encontramos resultados en la plataforma para esa búsqueda.'
      : 'Empieza escribiendo o revisa las sugerencias iniciales.',
  );

  ngOnInit(): void {
    this.runSearch(this.query());
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  onQueryChange(value: string): void {
    this.query.set(value ?? '');
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.runSearch(this.query()), this.debounceMs);
  }

  choose(entry: GlobalSearchItem): void {
    this.router.navigateByUrl(entry.route);
    this.dialogRef.close(entry.route);
  }

  typeLabel(type: GlobalSearchItem['type']): string {
    const labels: Record<GlobalSearchItem['type'], string> = {
      course: 'Curso',
      section_course: 'Curso - Seccion',
      virtual_classroom: 'Aula virtual',
      assessment: 'Evaluacion',
      student: 'Estudiante',
      teacher: 'Docente',
      payment: 'Pago',
    };

    return labels[type] ?? 'Resultado';
  }

  private runSearch(term: string): void {
    this.loading.set(true);
    this.searchApi.search({ search: term.trim(), limit: 12 }).subscribe({
      next: (response) => {
        this.results.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }
}
