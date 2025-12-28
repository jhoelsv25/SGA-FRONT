import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
export interface TabItem {
  id: string;
  label: string;
  icon: string; // Font Awesome class string or SVG path
  iconType?: 'fontawesome' | 'svg'; // Type of icon
  disabled?: boolean;
}
@Component({
  selector: 'sga-tab',
  imports: [CommonModule],
  templateUrl: './tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab implements OnInit {
  tabs = input.required<TabItem[]>();
  activeTabId = input.required<string>();
  variant = input<'primary' | 'secondary' | 'success' | 'warning' | 'danger'>('primary');

  // Output para cambio de tab
  tabChange = output<string>();

  ngOnInit() {
    // Validar que el tab activo existe
    const activeTab = this.tabs().find((tab) => tab.id === this.activeTabId());
    if (!activeTab) {
      console.warn(`Tab with id "${this.activeTabId()}" not found`);
    }
  }

  onTabClick(tab: TabItem) {
    if (!tab.disabled) {
      this.tabChange.emit(tab.id);
    }
  }

  getIconType(tab: TabItem): 'fontawesome' | 'svg' {
    // If iconType is explicitly set, use it
    if (tab.iconType) {
      return tab.iconType;
    }

    // Auto-detect: if icon contains 'fa' classes, it's fontawesome
    if (
      tab.icon.includes('fas ') ||
      tab.icon.includes('far ') ||
      tab.icon.includes('fab ') ||
      tab.icon.includes('fa-')
    ) {
      return 'fontawesome';
    }

    // Otherwise, assume it's SVG path
    return 'svg';
  }

  getTabClasses(tab: TabItem): string {
    const isActive = tab.id === this.activeTabId();
    const variant = this.variant();

    if (isActive) {
      return this.getActiveClasses(variant);
    } else {
      return this.getInactiveClasses();
    }
  }

  private getActiveClasses(variant: string): string {
    const variantClasses = {
      primary: 'border-primary-500 text-primary-600',
      secondary: 'border-gray-500 text-gray-600',
      success: 'border-green-500 text-green-600',
      warning: 'border-yellow-500 text-yellow-600',
      danger: 'border-red-500 text-red-600',
    };

    return variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary;
  }

  private getInactiveClasses(): string {
    return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  }
}
