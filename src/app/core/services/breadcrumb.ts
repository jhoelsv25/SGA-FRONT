import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
export type IBreadcrumb = {
  label: string;
  url?: string;
};

@Injectable({
  providedIn: 'root',
})
export class Breadcrumb {
  private activatedRoute = inject(ActivatedRoute);

  public buildBreadcrumbs() {
    const breadcrumbs: IBreadcrumb[] = [];
    let currentRoute = this.activatedRoute.root;
    let url = '';

    while (currentRoute.children.length > 0) {
      const childRoutes = currentRoute.children;
      let breadCrumbLabel = '';
      let breadCrumbUrl = '';

      for (const child of childRoutes) {
        if (child.outlet === 'primary') {
          const routeSnapshot = child.snapshot;
          if (routeSnapshot.data['breadcrumb']) {
            breadCrumbLabel =
              typeof routeSnapshot.data['breadcrumb'] === 'function'
                ? routeSnapshot.data['breadcrumb'](routeSnapshot)
                : routeSnapshot.data['breadcrumb'];
            breadCrumbUrl = routeSnapshot.url.map((segment) => segment.path).join('/');
            url += `/${breadCrumbUrl}`;
            breadcrumbs.push({ label: breadCrumbLabel, url });
          }
          currentRoute = child;
        }
      }
    }
    return {
      subscribe: (fn: (bc: IBreadcrumb[]) => void) => fn(breadcrumbs),
    };
  }
}
