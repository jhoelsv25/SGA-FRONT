import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Module } from '@auth/types/auth-type';
import { LayoutStore } from '@core/stores/layout.store';
import { filter, Subject, takeUntil } from 'rxjs';
import { UserMenu, UserMenuAction } from '@shared/components/user-menu/user-menu';

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
  permissions: string[];
  active?: boolean;
  hasChildren?: boolean;
  expanded?: boolean;
}

@Component({
  selector: 'sga-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenu],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  public authFacade = inject(AuthFacade); // Public for template access
  public layout = inject(LayoutStore); // Public for template access
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  
  // Computeds from Store
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public currentUser = computed(() => this.authFacade.getCurrentUser());
  public modules = computed(() => this.authFacade.getModules());

  // Local State Signals
  public hoveredItem = signal<MenuItem | null>(null);
  public expandedMenus = signal<string[]>([]);
  public activeRoute = signal<string>('');
  public isMobile = signal(false);
  public isUserMenuOpen = signal(false); // User Dropdown State

  public toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  public isMobileOpen = computed(() => {
    return this.isMobile() && !this.isSidebarCollapsed(); // In mobile, collapsed means closed/hidden
  });

  // --- Menu Construction ---

  // Computed final de menú
  public menuItems = computed(() => {
    const modules = this.modules();
    if (!modules || modules.length === 0) {
      return [];
    }
    // 1. Filtrar públicos y ordenar padres
    const publicModules = modules
      .filter((m: Module) => m.visibility === 'public')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // 2. Función recursiva para ordenar hijos
    const processModule = (mod: Module): Module => ({
      ...mod,
      children: mod.children
        ?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(processModule) || [],
    });

    // 3. Construir items
    return publicModules.map((m: Module) => this.buildMenuItem(processModule(m)));
  });

  private buildMenuItem(module: Module): MenuItem {
    const hasChildren = Boolean(module.children?.length);
    const route = module.path || '';

    return {
      id: module.id,
      icon: this.normalizeIcon(module.icon),
      label: module.name,
      route,
      permissions: module.permissions,
      active: this.isRouteActive(route, this.activeRoute()),
      children: module.children?.map((child: Module) => this.buildMenuItem(child)) || [],
      hasChildren,
    };
  }

  private normalizeIcon(icon: string): string {
    if (!icon) return 'fa-circle';
    if (icon.startsWith('fa-')) return icon;
    // Map common material icons if needed, or default
    return `fa-${icon}`;
  }

  // --- Permissions ---

  public getVisibleMenuItems(): MenuItem[] {
    return this.filterByPermissions(this.menuItems());
  }

  private filterByPermissions(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => this.hasPermission(item.permissions))
      .map((item) => ({
        ...item,
        children: this.filterByPermissions(item.children || []),
      }));
  }

  private hasPermission(permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((p) => this.authFacade.hasPermission(p));
  }

  // --- Interaction & Navigation ---

  public navigateToItem(item: MenuItem): void {
    if (item.hasChildren) {
      if (!this.isSidebarCollapsed()) {
        this.toggleSubmenu(item.id);
      }
    } else if (item.route) {
      this.router.navigate([item.route]);
      this.closeMobileSidebar();
    }
  }

  public toggleSubmenu(menuId: string): void {
    if (this.isSidebarCollapsed()) return;

    this.expandedMenus.update((expanded) => {
      if (expanded.includes(menuId)) {
        return expanded.filter((id) => id !== menuId);
      }
      return [...expanded, menuId];
    });
  }

  public isSubmenuExpanded(menuId: string): boolean {
    return this.expandedMenus().includes(menuId);
  }

  public toggleCollapse(): void {
    this.layout.toggleSidebar();
    // If collapsing, clear expanded menus for cleaner reopening
    if (this.layout.isSidebarCollapsed()) {
      this.expandedMenus.set([]);
    }
  }

  public closeMobileSidebar(): void {
    if (this.isMobile()) {
       // Assuming layout store has a method to close specifically or toggle
       // If isSidebarCollapsed is actually "isOpen" in mobile context, we need to ensure it closes.
       // Based on home.css, 'sidebar-open' class is controlled by 'isShowAside'?, 
       // but sidebar itself is controlled by layout.isSidebarCollapsed.
       // Usually mobile sidebar needs an specific 'open' state. 
       // Re-using toggleSidebar() if it's currently open (which means NOT collapsed in some logic, or explicit open)
       // Let's assume toggleSidebar switches state.
       this.layout.toggleSidebar(); // Close it
    }
  }

  // --- Utils ---
  
  private isRouteActive(itemRoute: string, currentRoute: string): boolean {
    if (!itemRoute) return false;
    if (itemRoute === '/' || itemRoute === '') return currentRoute === '/';
    return currentRoute === itemRoute || currentRoute.startsWith(`${itemRoute}/`);
  }

  private checkMobileDevice(): void {
    this.isMobile.set(window.innerWidth <= 768);
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
          this.activeRoute.set(event.urlAfterRedirects || event.url);
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

  // Hover handlers for collapsed mode flyout
  onMouseEnter(item: MenuItem) {
    if (this.isSidebarCollapsed() && item.hasChildren) {
      this.hoveredItem.set(item);
    }
  }

  onMouseLeave() {
    this.hoveredItem.set(null);
  }

  // User Display Methods
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

  // User Menu Actions Configuration
  userMenuActions = computed<UserMenuAction[]>(() => {
    const theme = this.layout.theme();
    return [
      {
        label: 'Mi Perfil',
        icon: 'fas fa-user',
        type: 'profile',
        action: () => this.router.navigate(['/profile']),
      },
      {
        label: 'Configuración',
        icon: 'fas fa-cog',
        type: 'settings',
        action: () => this.router.navigate(['/settings']),
      },
      {
        label: 'Cambiar contraseña',
        icon: 'fas fa-key',
        type: 'change-password',
        action: () => console.log('Change password'),
      },
      {
        label:
          theme === 'light'
            ? 'Tema Claro'
            : theme === 'dark'
              ? 'Tema Oscuro'
              : 'Tema del Sistema',
        icon: 'theme-' + theme,
        type: 'theme',
      },
    ];
  });

  onUserMenuAction(action: UserMenuAction) {
    if (action.type === 'logout') {
      this.authFacade.logout();
    } else if (action.type === 'theme') {
      this.layout.toggleTheme();
    } else if (action.action) {
      action.action();
    }
  }
}
