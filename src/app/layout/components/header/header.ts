import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { LayoutStore } from '@core/stores/layout.store';
import { NotificationStore } from '@core/stores/notification.store';
import { ZardIconComponent } from '@shared/components/icon';
import {
  UserMenu,
  UserMenuAction,
  UserMenuDetail,
  UserMenuStat,
} from '@shared/widgets/user-menu/user-menu';
import { Subject } from 'rxjs';

@Component({
  selector: 'sga-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenu, ZardIconComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private layout = inject(LayoutStore);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  public notificationStore = inject(NotificationStore);

  public unreadNotifications = computed(() => this.notificationStore.unreadCount());

  public isShowAside = computed(() => this.layout.isShowAside());
  public isShowNav = computed(() => this.layout.isShowNav());
  public isDark = computed(() => this.layout.isDark());
  public currentTheme = computed(() => this.layout.currentTheme());
  public isSystemTheme = computed(() => this.layout.isSystemTheme());
  public isShowMenu = signal<boolean>(false);
  public currentUser = computed(() => this.authFacade.getCurrentUser());
  public searchQuery = signal<string>('');

  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public modules = computed(() => this.authFacade.getModules());

  public userMenuDetails = computed<UserMenuDetail[]>(() => {
    const user = this.currentUser();
    const profile = user?.profile;
    const modules = this.modules() ?? [];
    const details: UserMenuDetail[] = [
      {
        label: 'Rol activo',
        value: profile?.roleLabel || this.getUserRole(),
        icon: 'fa-user-shield',
      },
      {
        label: 'Módulos',
        value: `${modules.length} habilitados`,
        icon: 'fa-grid-2',
      },
    ];

    if (profile?.institution) {
      details.push({
        label: 'Institución',
        value: profile.institution,
        icon: 'fa-school',
      });
    }

    if (user?.person?.email || user?.email) {
      details.push({
        label: 'Correo',
        value: user?.person?.email || user?.email || 'No registrado',
        icon: 'fa-envelope',
      });
    }

    return details;
  });

  public userMenuStats = computed<UserMenuStat[]>(() => {
    const profileStats = this.currentUser()?.profile?.stats as Record<string, unknown> | undefined;
    if (profileStats) {
      return Object.entries(profileStats)
        .slice(0, 3)
        .map(([key, value]) => ({
          label: this.mapStatLabel(key),
          value: this.normalizeStatValue(value),
        }));
    }

    return [
      { label: 'Módulos', value: this.modules().length },
      { label: 'Cursos', value: 0 },
      { label: 'Prom.', value: 'N/A' },
    ];
  });

  ngOnInit() {
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleOutsideClick.bind(this));
  }

  private handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.isShowMenu.set(false);
    }
  }
  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }

  public toggleNav(): void {
    this.layout.toggleNav();
  }

  public toggleAside(type: string): void {
    this.layout.toggleAside(type);
  }

  public toggleMenu(): void {
    this.isShowMenu.update((prev) => !prev);
  }

  public toggleTheme(): void {
    this.layout.toggleTheme();
  }

  public onSearch(): void {
    // Despachar evento personalizado para abrir el search global
    window.dispatchEvent(new CustomEvent('open-search-global'));
  }

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  public logout(): void {
    console.log('🚪 [Header] Cerrando sesión...');
    this.isShowMenu.set(false);
    this.authFacade.logout();
  }

  public getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';

    const firstName = user.firstName || user.person?.firstName || user.username || '';
    const lastName = user.lastName || user.person?.lastName || '';

    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  public getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';

    const firstName = user.firstName || user.person?.firstName || '';
    const lastName = user.lastName || user.person?.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.username || 'Usuario';
  }

  public getUserRole(): string {
    const user = this.currentUser();
    if (!user || !user.role) return 'Usuario';

    return user.role.name || 'Usuario';
  }

  public getUserCode(): string {
    const user = this.currentUser();
    if (!user) return '000000';

    return user.code || user.profile?.code || user.id?.padStart(6, '0') || '000000';
  }

  public getUserAvatar(): string {
    const user = this.currentUser();
    if (user?.profilePicture) {
      return user.profilePicture;
    }

    if (user?.person?.photoUrl) {
      return user.person.photoUrl;
    }

    return '/logo.jpeg';
  }

  goProfile = () => this.router.navigateByUrl('/account/profile');
  goSessions = () => this.router.navigateByUrl('/administration/sessions');
  goSettings = () => this.router.navigateByUrl('/account/settings');
  goChangePass = () => this.router.navigateByUrl('/account/change-password');

  onAction(event: UserMenuAction) {
    if (event.type === 'logout') {
      this.logout();
    } else if (event.type === 'theme') {
      this.toggleTheme();
    } else if (event.action) {
      event.action();
    }
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
}
