import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  input,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Module } from '@auth/types/auth-type';
import { AvatarVersionService } from '@core/services/avatar-version.service';
import { LayoutStore } from '@core/stores/layout.store';
import { filter, Subject, takeUntil } from 'rxjs';
import { ZardIconComponent, type ZardIcon } from '@shared/components/icon';
import { ZardPopoverDirective } from '@shared/components/popover/popover.component';
import {
  UserMenu,
  UserMenuAction,
  UserMenuDetail,
  UserMenuStat,
} from '@shared/widgets/user-menu/user-menu';
import type { CurrentUserProfile } from '@auth/types/auth-type';

export interface MenuItem {
  id: string;
  icon: ZardIcon;
  label: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
  permissions: string[];
  active?: boolean;
  hasChildren?: boolean;
  expanded?: boolean;
}

const LEGACY_SIDEBAR_ICONS: Record<string, ZardIcon> = {
  'fa-home': 'house',
  'fa-cog': 'settings',
  'fa-calendar-alt': 'calendar',
  'fa-clock': 'clock',
  'fa-layer-group': 'layers',
  'fa-th': 'layout-grid',
  'fa-book': 'book',
  'fa-star': 'star',
  'fa-sitemap': 'layers-2',
  'fa-users': 'users',
  'fa-link': 'arrow-right',
  'fa-calendar-days': 'calendar',
  'fa-user-graduate': 'graduation-cap',
  'fa-list': 'layout-grid',
  'fa-file-signature': 'file-text',
  'fa-user-shield': 'shield',
  'fa-comment-medical': 'chat',
  'fa-chalkboard-teacher': 'book-open-text',
  'fa-user-check': 'badge-check',
  'fa-clipboard-check': 'clipboard',
  'fa-check-circle': 'circle-check',
  'fa-chart-pie': 'activity',
  'fa-file-alt': 'file-text',
  'fa-clipboard-list': 'clipboard',
  'fa-pen-square': 'square',
  'fa-chart-line': 'activity',
  'fa-flag': 'target',
  'fa-chart-bar': 'activity',
  'fa-chalkboard': 'book-open-text',
  'fa-door-open': 'book-open',
  'fa-folder': 'folder',
  'fa-file': 'file',
  'fa-tasks': 'check',
  'fa-upload': 'upload',
  'fa-comments': 'chat',
  'fa-comment-dots': 'chat',
  'fa-money-bill-wave': 'credit-card',
  'fa-file-invoice-dollar': 'credit-card',
  'fa-exclamation-triangle': 'triangle-alert',
  'fa-history': 'clock',
  'fa-bullhorn': 'bell',
  'fa-bell': 'bell',
  'fa-envelope-open-text': 'mail',
  'fa-graduation-cap': 'graduation-cap',
  'fa-cogs': 'settings',
  'fa-building': 'building',
  'fa-users-cog': 'users',
  'fa-user-tag': 'user',
  'fa-key': 'shield',
  'fa-desktop': 'monitor',
  'fa-file-search': 'search',
};

@Component({
  selector: 'sga-sidebar',

  imports: [
    CommonModule,
    RouterModule,
    UserMenu,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardPopoverDirective,
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  public authFacade = inject(AuthFacade); // Public for template access
  public layout = inject(LayoutStore); // Public for template access
  private avatarVersion = inject(AvatarVersionService);
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

  private normalizeIcon(icon: string): ZardIcon {
    if (!icon) return 'circle';
    return LEGACY_SIDEBAR_ICONS[icon] ?? (icon as ZardIcon);
  }

  // --- Permissions ---

  public getVisibleMenuItems(): MenuItem[] {
    const permitted = this.filterByPermissions(this.menuItems());
    const roleScoped = this.relabelMenuTree(this.filterByRoleProfile(permitted));
    const term = this.sidebarSearch().trim().toLowerCase();
    if (!term) return roleScoped;

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

    return filterTree(roleScoped);
  }

  private relabelMenuTree(items: MenuItem[]): MenuItem[] {
    const roleType = this.resolveProfileType();
    const labelMapByRole: Record<string, Record<string, string>> = {
      teacher: {
        dashboard: 'Inicio',
        'access-control': 'Control de accesos',
        students: 'Mis cursos',
        attendance: 'Mi asistencia',
        assessments: 'Mis evaluaciones',
        behavior: 'Seguimiento',
        'virtual-classroom': 'Mi aula virtual',
        communications: 'Comunicaciones',
        reports: 'Mis reportes',
        'students-list': 'Cursos y alumnos',
        'student-observations': 'Observaciones',
        'attendance-register': 'Pasar lista',
        'attendance-reports': 'Historial',
        'assessments-list': 'Lista de evaluaciones',
        'assessment-scores': 'Registrar notas',
        grades: 'Consolidado',
        'behavior-records': 'Incidencias',
        'behavior-reports': 'Resumen',
        announcements: 'Avisos',
        notifications: 'Notificaciones',
        'reports-academic': 'Rendimiento',
        'reports-attendance': 'Asistencia',
        'reports-behavior': 'Convivencia',
      },
      student: {
        dashboard: 'Inicio',
        'virtual-classroom': 'Mis cursos',
        communications: 'Mis avisos',
        payments: 'Mis pagos',
        reports: 'Mi progreso',
        announcements: 'Avisos',
        notifications: 'Notificaciones',
        'payments-pending': 'Por pagar',
        'payments-history': 'Historial',
        'reports-academic': 'Notas',
        'reports-attendance': 'Asistencia',
      },
      guardian: {
        dashboard: 'Inicio',
        students: 'Mis estudiantes',
        communications: 'Comunicaciones',
        payments: 'Pagos',
        reports: 'Reportes',
        'students-list': 'Listado',
        'student-observations': 'Observaciones',
        announcements: 'Avisos',
        notifications: 'Notificaciones',
        'payments-pending': 'Pendientes',
        'payments-history': 'Historial',
        'reports-academic': 'Académicos',
        'reports-attendance': 'Asistencia',
        'reports-behavior': 'Conducta',
      },
    };

    const map = labelMapByRole[roleType];
    if (!map) return items;

    const relabel = (entries: MenuItem[]): MenuItem[] =>
      entries.map((item) => ({
        ...item,
        label: map[item.id] ?? item.label,
        children: relabel(item.children || []),
      }));

    return relabel(items);
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

  private filterByRoleProfile(items: MenuItem[]): MenuItem[] {
    const roleType = this.resolveProfileType();
    if (
      roleType === 'superadmin' ||
      roleType === 'admin' ||
      roleType === 'director' ||
      roleType === 'subdirector' ||
      roleType === 'ugel'
    ) {
      return items;
    }

    const allowedTopLevelByRole: Record<string, Set<string>> = {
      teacher: new Set([
        'dashboard',
        'students',
        'attendance',
        'assessments',
        'behavior',
        'virtual-classroom',
        'communications',
        'reports',
      ]),
      student: new Set(['dashboard', 'virtual-classroom', 'communications', 'payments', 'reports']),
      guardian: new Set(['dashboard', 'students', 'communications', 'payments', 'reports']),
      guest: new Set(['dashboard']),
      user: new Set(['dashboard']),
    };

    const allowed = allowedTopLevelByRole[roleType];
    if (!allowed) return items;

    return items
      .filter((item) => allowed.has(item.id) || item.active)
      .map((item) => ({
        ...item,
        children: this.filterRoleChildren(item, roleType),
      }));
  }

  private filterRoleChildren(item: MenuItem, roleType: string): MenuItem[] {
    const children = item.children || [];
    if (children.length === 0) return [];

    const allowByRoleAndParent: Record<string, Record<string, Set<string>>> = {
      teacher: {
        students: new Set(['students-list', 'student-observations']),
        attendance: new Set(['attendance-register', 'attendance-reports']),
        assessments: new Set(['assessments-list', 'assessment-scores', 'grades']),
        behavior: new Set(['behavior-records', 'behavior-reports']),
        'virtual-classroom': new Set(['virtual-classrooms-list']),
        communications: new Set(['announcements', 'notifications']),
        reports: new Set(['reports-academic', 'reports-attendance', 'reports-behavior']),
      },
      student: {
        'virtual-classroom': new Set(['virtual-classrooms-list']),
        communications: new Set(['announcements', 'notifications']),
        payments: new Set(['payments-pending', 'payments-history']),
        reports: new Set(['reports-academic', 'reports-attendance']),
      },
      guardian: {
        students: new Set(['students-list', 'student-observations']),
        communications: new Set(['announcements', 'notifications']),
        payments: new Set(['payments-pending', 'payments-history']),
        reports: new Set(['reports-academic', 'reports-attendance', 'reports-behavior']),
      },
    };

    const allowed = allowByRoleAndParent[roleType]?.[item.id];
    if (!allowed) return children;
    return children.filter((child) => allowed.has(child.id) || child.active);
  }

  private resolveProfileType(): NonNullable<CurrentUserProfile['type']> {
    const profileType = this.currentUser()?.profile?.type;
    if (profileType) return profileType;

    const roleName = (this.currentUser()?.role?.name ?? '').toLowerCase();
    if (roleName.includes('super')) return 'superadmin';
    if (roleName.includes('admin')) return 'admin';
    if (roleName.includes('director')) return 'director';
    if (roleName.includes('docente') || roleName.includes('teacher')) return 'teacher';
    if (
      roleName.includes('estudiante') ||
      roleName.includes('student') ||
      roleName.includes('alumno')
    )
      return 'student';
    if (roleName.includes('apoderado') || roleName.includes('guardian')) return 'guardian';
    return 'user';
  }

  private getTeacherProfileId(): string {
    const details = this.currentUser()?.profile?.details;
    if (!details || typeof details !== 'object') return '';
    const teacherId = (details as Record<string, unknown>)['teacherId'];
    return typeof teacherId === 'string' ? teacherId : '';
  }

  private getTeacherProfileName(): string {
    return this.getUserDisplayName() || this.currentUser()?.profile?.code || '';
  }

  private navigateToTeacherAssignments(): void {
    this.router.navigate(['/organization/section-courses'], {
      queryParams: {
        ...(this.getTeacherProfileId() ? { teacherId: this.getTeacherProfileId() } : {}),
        ...(this.getTeacherProfileName() ? { teacherName: this.getTeacherProfileName() } : {}),
      },
    });
  }

  private navigateToTeacherSchedules(): void {
    this.router.navigate(['/organization/schedules'], {
      queryParams: {
        ...(this.getTeacherProfileId() ? { teacherId: this.getTeacherProfileId() } : {}),
        ...(this.getTeacherProfileName() ? { teacherName: this.getTeacherProfileName() } : {}),
      },
    });
  }

  // --- Interaction & Navigation ---

  public navigateToItem(item: MenuItem): void {
    if (item.hasChildren) {
      if (!this.isSidebarCollapsed()) {
        this.toggleSubmenu(item.id);
      }
    } else if (item.route) {
      const [path, queryString] = item.route.split('?');
      const queryParams = queryString
        ? Object.fromEntries(new URLSearchParams(queryString).entries())
        : undefined;
      this.router.navigate([path], { queryParams });
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
    const normalizedItemRoute = itemRoute.split('?')[0];
    const normalizedCurrentRoute = currentRoute.split('?')[0];
    if (normalizedItemRoute === '/' || normalizedItemRoute === '')
      return normalizedCurrentRoute === '/';
    return (
      normalizedCurrentRoute === normalizedItemRoute ||
      normalizedCurrentRoute.startsWith(`${normalizedItemRoute}/`)
    );
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

  getUserAvatar(): string | null {
    const user = this.currentUser();
    if (user?.profilePicture) {
      return this.avatarVersion.withVersion(user.profilePicture);
    }
    if (user?.person?.photoUrl) {
      return this.avatarVersion.withVersion(user.person.photoUrl);
    }
    return null;
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

  private getRoleScopedMenuActions(): UserMenuAction[] {
    const roleType = this.resolveProfileType();
    const theme = this.layout.theme();
    const themeAction: UserMenuAction = {
      label:
        theme === 'light' ? 'Tema Claro' : theme === 'dark' ? 'Tema Oscuro' : 'Tema del Sistema',
      icon: 'theme-' + theme,
      type: 'theme',
    };

    const baseActions: UserMenuAction[] = [
      {
        label: 'Mi Perfil',
        icon: 'fas fa-user',
        type: 'profile',
        action: () => this.router.navigate(['/account/profile']),
      },
    ];

    if (roleType === 'teacher') {
      return [
        ...baseActions,
        {
          label: 'Mis cursos y secciones',
          icon: 'fa-book',
          type: 'assignments',
          action: () => this.navigateToTeacherAssignments(),
        },
        {
          label: 'Mis horarios',
          icon: 'fa-calendar-alt',
          type: 'schedules',
          action: () => this.navigateToTeacherSchedules(),
        },
        {
          label: 'Mi aula virtual',
          icon: 'fa-chalkboard',
          type: 'classroom',
          action: () => this.router.navigate(['/virtual-classroom/list']),
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
        themeAction,
      ];
    }

    if (roleType === 'student') {
      return [
        ...baseActions,
        {
          label: 'Mis aulas',
          icon: 'fa-chalkboard',
          type: 'classroom',
          action: () => this.router.navigate(['/virtual-classroom/list']),
        },
        {
          label: 'Mis pagos',
          icon: 'fa-money-bill-wave',
          type: 'payments',
          action: () => this.router.navigate(['/payments/history']),
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
        themeAction,
      ];
    }

    if (roleType === 'guardian') {
      return [
        ...baseActions,
        {
          label: 'Mis estudiantes',
          icon: 'fa-user-graduate',
          type: 'students',
          action: () => this.router.navigate(['/students/list']),
        },
        {
          label: 'Pagos',
          icon: 'fa-money-bill-wave',
          type: 'payments',
          action: () => this.router.navigate(['/payments/pending']),
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
        themeAction,
      ];
    }

    return [
      ...baseActions,
      {
        label: 'Configuración',
        icon: 'fas fa-cog',
        type: 'settings',
        action: () => this.router.navigate(['/account/settings']),
      },
      {
        label: 'Sesiones',
        icon: 'fas fa-history',
        type: 'sessions',
        action: () => this.router.navigate(['/administration/sessions']),
      },
      {
        label: 'Cambiar contraseña',
        icon: 'fas fa-key',
        type: 'change-password',
        action: () => this.router.navigate(['/account/change-password']),
      },
      themeAction,
    ];
  }

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
    return this.getRoleScopedMenuActions();
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
