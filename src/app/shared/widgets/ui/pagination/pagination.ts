import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-pagination',
  imports: [Button],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Inputs
  public total = input<number>(0);
  public size = input<number>(10);
  public page = input<number>(1);
  public sizeOptions = input<number[]>([10, 20, 25, 50, 100]);
  public useParams = input<boolean>(true);

  // Output
  public pageChange = output<{ page: number; size: number }>();

  // Signal local para la página actual y tamaño de página
  public currentPage = signal(this.page());
  public currentSize = signal(this.size());

  // Computed total de páginas
  public totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.currentSize())));

  constructor() {
    effect(() => {
      this.currentPage.set(this.page());
      this.currentSize.set(this.size());
    });
  }

  // Inicializar desde queryParams si useParams está habilitado
  ngOnInit() {
    if (this.useParams()) {
      const queryParams = this.route.snapshot.queryParams;
      const pageFromUrl = parseInt(queryParams['page']) || this.page();
      const sizeFromUrl = parseInt(queryParams['size']) || this.size();

      this.currentPage.set(pageFromUrl);
      this.currentSize.set(sizeFromUrl);
    }
  }

  // Calcular las páginas visibles (máx 5)
  public visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // Métodos de navegación
  public goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    const payload = { page, size: this.currentSize() };
    this.pageChange.emit(payload);

    if (this.useParams()) {
      this.router.navigate([], {
        queryParams: { page, size: this.currentSize() },
        queryParamsHandling: 'merge',
      });
    }
  }

  public firstPage() {
    this.goToPage(1);
  }

  public lastPage() {
    this.goToPage(this.totalPages());
  }

  public prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  public nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  // Texto rango visible
  public getRange(): string {
    const start = (this.currentPage() - 1) * this.currentSize() + 1;
    const end = Math.min(this.currentPage() * this.currentSize(), this.total());
    return `Mostrando ${start}–${end} de ${this.total()}`;
  }

  // Cambio de tamaño de página
  public changeSize(newSize: number) {
    this.currentSize.set(newSize);
    this.goToPage(1); // reset a la primera página
  }
}
