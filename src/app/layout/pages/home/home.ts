import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { Aside } from 'app/layout/components/aside/aside';
import { Header } from 'app/layout/components/header/header';
import { Sidebar } from 'app/layout/components/sidebar/sidebar';

@Component({
  selector: 'sga-home',
  imports: [Aside, Header, Sidebar, RouterOutlet],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private layout = inject(LayoutStore);

  public isDarkMode = computed(() => this.layout.isDark());
  public isShowAside = computed(() => this.layout.isShowAside());
  public isShowNav = computed(() => this.layout.isShowNav());

  public closeAside(): void {
    this.layout.closeAside();
  }

  constructor() {
    console.log('Home component initialized');
  }
}
