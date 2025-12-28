import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LayoutStore } from '@core/stores/layout.store';

@Component({
  selector: 'sga-aside',
  imports: [],
  templateUrl: './aside.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Aside {
  private layout = inject(LayoutStore);

  public isShowAside = computed(() => this.layout.isShowAside());
  public asideType = computed(() => this.layout.titleAside());

  public toggleAside(): void {
    this.layout.closeAside();
  }
}
