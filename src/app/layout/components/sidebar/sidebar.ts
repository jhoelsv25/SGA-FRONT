import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Module } from '@auth/types/auth-type';
import { LayoutStore } from '@core/stores/layout.store';
import { filter, Subject, takeUntil } from 'rxjs';
interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
  permissions: string[];
  active?: boolean;
  hasChildren?: boolean;
}
@Component({
  selector: 'sga-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  private authFacade = inject(AuthFacade);
  private layout = inject(LayoutStore);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public hoveredItem = signal<MenuItem | null>(null);
  public isCollapsed = computed(() => this.layout.isSidebarCollapsed());

  // Signals
  public expandedMenus = signal<string[]>([]);
  public activeRoute = signal<string>('');
  public isMobile = signal(false);

  public isMobileOpen = computed(() => {
    return this.isMobile() && !this.isSidebarCollapsed();
  });

  // Computed values
  public currentUser = computed(() => this.authFacade.getCurrentUser());
  public modules = computed(() => this.authFacade.getModules());

  // Construir MenuItem desde Module
  private buildMenuItem(module: Module): MenuItem {
    const hasChildren = Boolean(module.children?.length);

    return {
      id: module.id,
      icon: this.normalizeIcon(module.icon),
      label: module.name,
      route: module.path,
      permissions: module.permissions,
      active: this.isRouteActive(module.path, this.activeRoute()),
      children: module.children?.map((child: Module) => this.buildMenuItem(child)) || [],
      hasChildren,
    };
  }

  // Permisos recursivos
  private filterByPermissions(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => this.hasPermission(item.permissions))
      .map((item) => ({
        ...item,
        children: this.filterByPermissions(item.children || []),
      }));
  }

  // Computed final de menú
  menuItems = computed(() => {
    const modules = this.modules();
    if (!modules || modules.length === 0) {
      return [];
    }
    // Ordenar padres (módulos públicos) solo por 'order'
    const publicModules = modules
      .filter((m: Module) => m.visibility === 'public')
      .sort((a, b) => {
        const ao = a.order ?? 0;
        const bo = b.order ?? 0;
        return ao - bo;
      });
    // Ordenar hijos solo por 'order' dentro de cada padre
    const sortChildren = (mod: Module): Module => ({
      ...mod,
      children:
        mod.children
          ?.sort((a, b) => {
            const ao = a.order ?? 0;
            const bo = b.order ?? 0;
            return ao - bo;
          })
          .map(sortChildren) || [],
    });
    // Construir menú manteniendo jerarquía
    return publicModules.map((m: Module) => this.buildMenuItem(sortChildren(m)));
  });

  // === Collapse ===

  isSubmenuExpanded(menuId: string): boolean {
    return this.expandedMenus().includes(menuId);
  }

  // === Lifecycle ===
  constructor() {
    effect(() => {
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntil(this.destroy$),
        )
        .subscribe((event) => {
          this.activeRoute.set(event.url);
        });
    });

    effect(() => {
      this.checkMobileDevice();
      window.addEventListener('resize', () => this.checkMobileDevice());
    });
  }

  ngOnInit(): void {
    this.activeRoute.set(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobileDevice());
  }

  // === Utils ===
  private checkMobileDevice(): void {
    this.isMobile.set(window.innerWidth <= 768);
  }

  private isRouteActive(itemRoute: string, currentRoute: string): boolean {
    return currentRoute === itemRoute || currentRoute.startsWith(`${itemRoute}/`);
  }

  toggleCollapse(): void {
    this.layout.toggleSidebar();
    if (this.layout.isSidebarCollapsed()) {
      this.expandedMenus.set([]);
    }
  }

  hasPermission(permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    const user = this.currentUser();
    if (!user) return false;
    return true; // TODO: lógica real de permisos
  }

  getVisibleMenuItems(): MenuItem[] {
    return this.filterByPermissions(this.menuItems());
  }

  navigateToItem(item: MenuItem): void {
    if (item.hasChildren) {
      if (!this.isCollapsed()) {
        this.toggleSubmenu(item.id);
      }
    } else if (item.route) {
      this.router.navigate([item.route]);
      this.closeMobileSidebar();
    }
  }

  toggleSubmenu(menuId: string): void {
    this.expandedMenus.update((expanded) => {
      const newExpanded = expanded.includes(menuId)
        ? expanded.filter((id) => id !== menuId)
        : [...expanded, menuId];
      return newExpanded;
    });
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (!user || !user.role) return 'Usuario';
    return user.role.name || 'Usuario';
  }

  formatBadge(count: number): string {
    return count > 999 ? '999+' : count.toString();
  }

  private normalizeIcon(icon: string): string {
    if (icon.startsWith('fa-')) return icon;
    const materialToFa: { [key: string]: string } = {
      settings: 'fa-cog',
      security: 'fa-shield-alt',
      apps: 'fa-th',
      lock: 'fa-lock',
      circle: 'fa-circle',
    };
    return materialToFa[icon] || `fa-${icon}`;
  }

  closeMobileSidebar(): void {
    if (this.isMobile() && !this.layout.isSidebarCollapsed()) {
      this.layout.toggleSidebar();
    }
  }

  openMobileSidebar(): void {
    if (this.isMobile() && this.layout.isSidebarCollapsed()) {
      this.layout.toggleSidebar();
    }
  }

  onMouseEnter(item: MenuItem) {
    if (this.isCollapsed() && item.hasChildren) {
      this.hoveredItem.set(item);
    }
  }

  onMouseLeave() {
    this.hoveredItem.set(null);
  }
}
