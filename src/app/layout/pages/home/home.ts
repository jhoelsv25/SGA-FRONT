import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { Sidebar } from 'app/layout/components/sidebar/sidebar';

@Component({
  selector: 'sga-home',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private layout = inject(LayoutStore);

  // Left Sidebar States
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public isMobile = computed(() => window.innerWidth < 768); 
  public isMobileOpen = computed(() => !this.isSidebarCollapsed() && this.isMobile());

  // Right Sidebar States
  public isRightSidebarOpen = signal(false);
  public rightSidebarTab = signal<'notifications' | 'calendar'>('notifications');
  public hasNotifications = signal(true); // TODO: Connect to real notification service

  public closeMobileSidebar() {
    this.layout.toggleSidebar();
  }

  public toggleRightSidebar() {
    this.isRightSidebarOpen.update(v => !v);
  }

  public setRightSidebarTab(tab: 'notifications' | 'calendar') {
    this.rightSidebarTab.set(tab);
  }
}
