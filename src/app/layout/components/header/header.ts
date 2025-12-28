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
import { UserMenu, UserMenuAction } from '@shared/components/user-menu/user-menu';
import { Subject } from 'rxjs';

@Component({
  selector: 'sga-header',
  imports: [CommonModule, RouterModule, UserMenu],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private layout = inject(LayoutStore);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  public isShowAside = computed(() => this.layout.isShowAside());
  public isShowNav = computed(() => this.layout.isShowNav());
  public isDark = computed(() => this.layout.isDark());
  public currentTheme = computed(() => this.layout.currentTheme());
  public isSystemTheme = computed(() => this.layout.isSystemTheme());
  public isShowMenu = signal<boolean>(false);
  public currentUser = computed(() => this.authFacade.getCurrentUser());
  public searchQuery = signal<string>('');

  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());

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

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  public getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';

    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  public getUserRole(): string {
    const user = this.currentUser();
    if (!user || !user.role) return 'Usuario';

    return user.role.name || 'Usuario';
  }

  public getUserCode(): string {
    const user = this.currentUser();
    if (!user) return '000000';

    return user.id?.padStart(6, '0') || '000000';
  }

  public getUserAvatar(): string {
    const user = this.currentUser();
    if (user?.profilePicture) {
      return user.profilePicture;
    }

    return '/logo.jpeg';
  }

  goProfile = () => this.router.navigateByUrl('/profile');
  goSettings = () => this.router.navigateByUrl('/settings');
  goChangePass = () => this.router.navigateByUrl('/change-password');

  onAction(event: UserMenuAction) {
    if (event.type === 'logout') {
      this.logout();
    } else if (event.type === 'theme') {
      this.toggleTheme();
    } else if (event.action) {
      event.action();
    }
  }
}
