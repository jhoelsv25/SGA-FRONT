import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Module } from '@auth/types/auth-type';
import { LayoutStore } from '@core/stores/layout.store';
import { filter, Subject, takeUntil } from 'rxjs';
import { ZardButtonComponent } from '@shared/components/button';
import { ZardInputDirective } from '@shared/components/input';
import { ZardPopoverDirective } from '@shared/components/popover/popover.component';
import { UserMenu, UserMenuAction, UserMenuDetail, UserMenuStat } from '@shared/widgets/user-menu/user-menu';

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
  imports: [CommonModule, RouterModule, UserMenu, ZardButtonComponent, ZardInputDirective, ZardPopoverDirective],
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
  public expandedMenus = signal<string[]>([]);
  public activeRoute = signal<string>('');
  public isMobile = signal(false);
  public isUserMenuOpen = signal(false); // User Dropdown State
  public sidebarSearch = signal('');

  public toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  public isMobileOpen = computed(() => {
    return this.isMobile() && !this.isSidebarCollapsed(); // In mobile, collapsed means closed/hidden
  });

  // --- Menu Construction ---

  // Computed final de menú
  public menuItems = computed(() => {
    const backendModules = this.modules() || [];

    // Función recursiva para mapear Module (backend) a MenuItem (sidebar)
    const mapToMenuItem = (mod: Module): MenuItem => {
      const route = mod.path || '';
      return {
        id: mod.id,
        icon: this.normalizeIcon(mod.icon || ''),
        label: mod.name,
        route,
        permissions: mod.permissions || [],
        active: this.isRouteActive(route, this.activeRoute()),
        children: mod.children?.map(mapToMenuItem) || [],
        hasChildren: Boolean(mod.children?.length),
      };
    };

    return backendModules.map(mapToMenuItem);
  });

  private normalizeIcon(icon: string): string {
    if (!icon) return 'fa-circle';

    const clean = icon.trim();

    // Si ya empieza con fa- o lo que sea, devolverlo
    if (clean.startsWith('fa-') || clean.startsWith('fas ') || clean.startsWith('fab ')) {
      return clean;
    }

    // Caso: "home" -> "fa-home"
    return `fa-${clean}`;
  }

  // --- Permissions ---

  public getVisibleMenuItems(): MenuItem[] {
    const permitted = this.filterByPermissions(this.menuItems());
    const term = this.sidebarSearch().trim().toLowerCase();
    if (!term) return permitted;

    const filterTree = (items: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];
      for (const item of items) {
        const filteredChildren = filterTree(item.children || []);
        const selfMatches =
          item.label.toLowerCase().includes(term) || item.route.toLowerCase().includes(term);
        if (selfMatches || filteredChildren.length > 0) {
          result.push({ ...item, children: filteredChildren });
        }
      }
      return result;
    };

    return filterTree(permitted);
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
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.activeRoute.set(event.urlAfterRedirects || event.url);
      });
  }

  ngOnInit(): void {
    this.activeRoute.set(this.router.url);
    this.checkMobileDevice();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.checkMobileDevice();
  }

  // User Display Methods
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const firstName = user.firstName || user.person?.firstName || user.username || '';
    const lastName = user.lastName || user.person?.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    const firstName = user.firstName || user.person?.firstName || '';
    const lastName = user.lastName || user.person?.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.username || 'Usuario';
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (!user || !user.role) return 'Usuario';
    return user.role.name || 'Usuario';
  }

  userMenuDetails = computed<UserMenuDetail[]>(() => {
    const user = this.currentUser();
    const modules = this.modules() ?? [];
    const roleName = (user?.role?.name ?? 'Usuario').trim();
    const roleKey = roleName.toLowerCase();
    const profile = user?.profile;

    const accessLabel = roleKey.includes('admin')
      ? 'Acceso total'
      : roleKey.includes('director')
        ? 'Gestión institucional'
        : roleKey.includes('docente') || roleKey.includes('teacher')
          ? 'Gestión académica'
          : roleKey.includes('alumno') || roleKey.includes('student')
            ? 'Portal estudiantil'
            : roleKey.includes('apoderado') || roleKey.includes('guardian')
              ? 'Seguimiento familiar'
              : 'Acceso de plataforma';

    const details: UserMenuDetail[] = [
      {
        label: 'Rol activo',
        value: profile?.roleLabel || roleName,
        icon: 'fa-solid fa-user-shield',
      },
      {
        label: 'Nivel',
        value: accessLabel,
        icon: 'fa-solid fa-layer-group',
      },
      {
        label: 'Módulos',
        value: `${modules.length} habilitados`,
        icon: 'fa-solid fa-grid-2',
      },
    ];

    if (profile?.institution) {
      details.push({
        label: 'Institución',
        value: profile.institution,
        icon: 'fa-solid fa-school',
      });
    }

    if (profile?.details && typeof profile.details === 'object') {
      const detailMap = profile.details as Record<string, unknown>;
      const extraDetailEntries: Array<[string, string, string]> = [
        ['specialization', 'Especialidad', 'fa-solid fa-book-open-reader'],
        ['teachingLevel', 'Nivel', 'fa-solid fa-layer-group'],
        ['studentType', 'Tipo', 'fa-solid fa-user-graduate'],
        ['relationship', 'Relación', 'fa-solid fa-people-roof'],
        ['occupation', 'Ocupación', 'fa-solid fa-briefcase'],
      ];

      for (const [key, label, icon] of extraDetailEntries) {
        const value = detailMap[key];
        if (value) {
          details.push({
            label,
            value: String(value),
            icon,
          });
        }
      }
    }

    if (user?.person?.email || user?.email) {
      details.push({
        label: 'Correo',
        value: user.person?.email || user.email || 'No registrado',
        icon: 'fa-solid fa-envelope',
      });
    }

    if (user?.person?.mobile || user?.person?.phone) {
      details.push({
        label: 'Contacto',
        value: user.person?.mobile || user.person?.phone || 'No registrado',
        icon: 'fa-solid fa-phone',
      });
    }

    if (user?.person?.district || user?.person?.department) {
      details.push({
        label: 'Ubicación',
        value: [user.person?.district, user.person?.department].filter(Boolean).join(', '),
        icon: 'fa-solid fa-location-dot',
      });
    }

    return details;
  });

  userMenuStats = computed<UserMenuStat[]>(() => {
    const user = this.currentUser();
    const roleKey = (user?.role?.name ?? '').toLowerCase();
    const stats = user?.stats;
    const profileStats = user?.profile?.stats as Record<string, unknown> | undefined;
    const modulesCount = this.modules()?.length ?? 0;

    if (profileStats) {
      const mapped = Object.entries(profileStats)
        .slice(0, 3)
        .map(([key, value]) => ({
          label: this.mapStatLabel(key),
          value: this.normalizeStatValue(value),
        }));

      if (mapped.length > 0) {
        return mapped;
      }
    }

    if (roleKey.includes('admin')) {
      return [
        { label: 'Módulos', value: modulesCount },
        { label: 'Usuarios', value: stats?.students ?? 0 },
        { label: 'Prom.', value: stats?.average ?? 'N/A' },
      ];
    }

    if (roleKey.includes('director')) {
      return [
        { label: 'Cursos', value: stats?.courses ?? 0 },
        { label: 'Alumnos', value: stats?.students ?? 0 },
        { label: 'Prom.', value: stats?.average ?? '0.0' },
      ];
    }

    if (roleKey.includes('docente') || roleKey.includes('teacher')) {
      return [
        { label: 'Cursos', value: stats?.courses ?? 0 },
        { label: 'Alumnos', value: stats?.students ?? 0 },
        { label: 'Prom.', value: stats?.average ?? '0.0' },
      ];
    }

    if (roleKey.includes('student') || roleKey.includes('alumno')) {
      return [
        { label: 'Cursos', value: stats?.courses ?? 0 },
        { label: 'Asist.', value: stats?.students ?? 0 },
        { label: 'Prom.', value: stats?.average ?? '0.0' },
      ];
    }

    return [
      { label: 'Módulos', value: modulesCount },
      { label: 'Cursos', value: stats?.courses ?? 0 },
      { label: 'Prom.', value: stats?.average ?? '0.0' },
    ];
  });

  private mapStatLabel(key: string): string {
    const labels: Record<string, string> = {
      weeklyHours: 'Horas',
      graduationYear: 'Promo.',
      dependents: 'Hijos',
      monthlyIncome: 'Ingreso',
    };

    return labels[key] ?? key;
  }

  private normalizeStatValue(value: unknown): string | number {
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    return 'N/A';
  }

  // User Menu Actions Configuration
  userMenuActions = computed<UserMenuAction[]>(() => {
    const theme = this.layout.theme();
    return [
      {
        label: 'Mi Perfil',
        icon: 'fas fa-user',
        type: 'profile',
        action: () => this.router.navigate(['/account/profile']),
      },
      {
        label: 'Configuración',
        icon: 'fas fa-cog',
        type: 'settings',
        action: () => this.router.navigate(['/account/settings']),
      },
      {
        label: 'Cambiar contraseña',
        icon: 'fas fa-key',
        type: 'change-password',
        action: () => this.router.navigate(['/account/change-password']),
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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.sidebarSearch.set(value);
  }

  clearSearch(): void {
    this.sidebarSearch.set('');
  }
}
