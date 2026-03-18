import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { NotificationStore } from '@core/stores/notification.store';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Aside } from '../../components/aside/aside';
import { Header } from '../../components/header/header';
import { ZardIconComponent } from '@shared/components/icon';

@Component({
  selector: 'sga-home',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, Aside, RouterOutlet, ZardIconComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private layout = inject(LayoutStore);
  private notifications = inject(NotificationStore);

  // Left Sidebar States
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public isMobile = computed(() => this.layout.isMobile());
  public isMobileOpen = computed(() => this.layout.isMobileOpen());

  public closeMobileSidebar() {
    this.layout.toggleSidebar();
  }
}
