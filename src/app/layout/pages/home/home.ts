import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Aside } from '../../components/aside/aside';
import { Header } from '../../components/header/header';

@Component({
  selector: 'sga-home',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, Aside, RouterOutlet],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private layout = inject(LayoutStore);

  // Left Sidebar States
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public isMobile = computed(() => this.layout.isMobile());
  public isMobileOpen = computed(() => this.layout.isMobileOpen());

  public closeMobileSidebar() {
    this.layout.toggleSidebar();
  }
}
