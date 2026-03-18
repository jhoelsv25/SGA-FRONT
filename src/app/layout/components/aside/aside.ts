import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LayoutStore } from '@core/stores/layout.store';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardTabComponent, ZardTabGroupComponent } from '@/shared/components/tabs';
import { AsideNotifications } from './components/aside-notifications/aside-notifications';
import { AsideCalendar } from './components/aside-calendar/aside-calendar';
import { AsideChats } from './components/aside-chats/aside-chats';

@Component({
  selector: 'sga-aside',
  standalone: true,
  imports: [
    ZardIconComponent,
    ZardButtonComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    AsideNotifications,
    AsideCalendar,
    AsideChats,
  ],
  templateUrl: './aside.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Aside {
  private layout = inject(LayoutStore);
  public tabGroup = viewChild(ZardTabGroupComponent);

  public isShowAside = computed(() => this.layout.isShowAside());
  public asideType = computed(() => this.layout.titleAside());

  constructor() {
    effect(() => {
      const type = this.asideType();
      const group = this.tabGroup();
      if (type && group) {
        const indexMap: Record<string, number> = {
          notifications: 0,
          calendar: 1,
          chats: 2,
        };
        const index = indexMap[type] ?? 0;
        group.selectTabByIndex(index);
      }
    });
  }

  public closeAside(): void {
    this.layout.closeAside();
  }
}
