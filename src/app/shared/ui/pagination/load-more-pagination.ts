import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '@shared/directives';

/**
 * Paginación por cursor: botón "Cargar más" para listas grandes.
 * No usa total ni páginas; emite el cursor para la siguiente petición.
 */
@Component({
  selector: 'sga-load-more-pagination',
  standalone: true,
  imports: [Button],
  templateUrl: './load-more-pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadMorePagination {
  /** Número de ítems cargados hasta ahora */
  loadedCount = input.required<number>();
  /** Si hay más resultados en el servidor */
  hasNext = input.required<boolean>();
  /** Cursor para la siguiente página (opcional si hasNext es false) */
  nextCursor = input<string | null | undefined>(null);
  /** Cargando más resultados */
  loading = input<boolean>(false);

  loadMore = output<string>();

  onLoadMore(): void {
    const cursor = this.nextCursor();
    if (cursor && this.hasNext() && !this.loading()) {
      this.loadMore.emit(cursor);
    }
  }
}
