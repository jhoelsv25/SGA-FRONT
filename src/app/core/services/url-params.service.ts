import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UrlParamsService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Retrieves a single query parameter from the URL.
   */
  getParam(key: string): string | null {
    return this.route.snapshot.queryParamMap.get(key);
  }

  /**
   * Retrieves all query parameters from the URL.
   */
  getAllParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const map = this.route.snapshot.queryParamMap;
    for (const key of map.keys) {
      params[key] = map.get(key) || '';
    }
    return params;
  }

  /**
   * Sets a single query parameter in the URL without reloading the page.
   * Passing null, undefined, or empty string will remove the parameter.
   */
  setParam(key: string, value: string | null | undefined): void {
    const queryParams: Record<string, string | null> = {};
    queryParams[key] = (value === '' || value === undefined) ? null : value;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Sets multiple query parameters in the URL without reloading the page.
   * Passing null, undefined, or empty string as a value will remove that parameter.
   */
  setParams(params: Record<string, string | null | undefined>): void {
    const cleanedParams: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(params)) {
      cleanedParams[key] = (value === '' || value === undefined) ? null : value;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanedParams,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Clears all query parameters from the URL.
   */
  clearParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }
}
