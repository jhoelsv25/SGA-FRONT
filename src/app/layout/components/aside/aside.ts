import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { ZardIconComponent, type ZardIcon } from '@/shared/components/icon';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardTabComponent, ZardTabGroupComponent } from '@/shared/components/tabs';
import { AsideNotifications } from './components/aside-notifications/aside-notifications';
import { AsideCalendar } from './components/aside-calendar/aside-calendar';
import { AsideChats } from './components/aside-chats/aside-chats';

@Component({
  selector: 'sga-aside',

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
  private router = inject(Router);
  private readonly syncingTabFromStore = signal(false);
  public tabGroup = viewChild(ZardTabGroupComponent);

  public isShowAside = computed(() => this.layout.isShowAside());
  public asideType = computed(() => this.layout.titleAside());
  public activeMeta = computed(() => {
    const type = this.asideType();
    const meta: Record<string, { icon: ZardIcon; label: string }> = {
      notifications: { icon: 'bell', label: 'Notificaciones' },
      calendar: { icon: 'calendar', label: 'Calendario' },
      chats: { icon: 'chat', label: 'Chats' },
    };
    return meta[type] ?? { icon: 'layers', label: 'Centro de Actividad' };
  });

  constructor() {
    effect(() => {
      const type = this.asideType();
      const isOpen = this.isShowAside();
      const group = this.tabGroup();
      if (isOpen && type && group) {
        const indexMap: Record<string, number> = {
          notifications: 0,
          calendar: 1,
          chats: 2,
        };
        const index = indexMap[type] ?? 0;
        this.syncingTabFromStore.set(true);
        group.selectTabByIndex(index);
        queueMicrotask(() => this.syncingTabFromStore.set(false));
      }
    });
  }

  public closeAside(): void {
    this.layout.closeAside();
  }

  public onTabChange(event: { index: number; label: string }): void {
    if (this.syncingTabFromStore()) return;

    const tabTypeMap: Record<number, string> = {
      0: 'notifications',
      1: 'calendar',
      2: 'chats',
    };
    const type = tabTypeMap[event.index];
    if (type) {
      this.layout.setAsideType(type);
    }
  }

  public openSettings(): void {
    this.router.navigateByUrl('/account/settings');
    this.closeAside();
  }

  public openHelp(): void {
    this.closeAside();
    window.dispatchEvent(new CustomEvent('open-search-global'));
  }

  public openFeedback(): void {
    this.router.navigateByUrl('/communications/list');
    this.closeAside();
  }
}
