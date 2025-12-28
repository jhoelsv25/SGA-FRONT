import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'sga-search',
  imports: [],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public localSearch = signal<string>('');

  //output
  public searchChange = output<string>();

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      console.log('Query Params on init:', params);
      if (params['search']) {
        this.localSearch.set(params['search']);
        this.searchChange.emit(params['search']);
      } else {
        this.localSearch.set('');
        this.searchChange.emit('');
      }
    });
  }

  onSearchLocalChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
    this.localSearch.set(value);
  }

  public onSearch(): string {
    this.setQueryParams({ search: this.localSearch() });
    return this.localSearch();
  }

  public clearSearch(): void {
    this.setQueryParams({ search: null });
    this.localSearch.set('');
  }

  private setQueryParams(params: { [key: string]: string | null }): void {
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
