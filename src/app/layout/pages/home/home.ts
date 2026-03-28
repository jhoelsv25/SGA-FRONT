import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Aside } from '../../components/aside/aside';
import { Header } from '../../components/header/header';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import type { ZardDialogRef } from '@shared/components/dialog';
import GlobalSearchModalComponent from '@/layout/components/global-search-modal/global-search-modal';

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
  private dialog = inject(DialogModalService);
  private searchRef: ZardDialogRef<GlobalSearchModalComponent> | null = null;
  private readonly onOpenSearchGlobal = () => this.openGlobalSearch();

  // Left Sidebar States
  public isSidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());
  public isMobile = computed(() => this.layout.isMobile());
  public isMobileOpen = computed(() => this.layout.isMobileOpen());

  public closeMobileSidebar() {
    this.layout.toggleSidebar();
  }

  ngOnInit(): void {
    window.addEventListener('open-search-global', this.onOpenSearchGlobal as EventListener);
    window.addEventListener('keydown', this.handleGlobalShortcut);
  }

  ngOnDestroy(): void {
    window.removeEventListener('open-search-global', this.onOpenSearchGlobal as EventListener);
    window.removeEventListener('keydown', this.handleGlobalShortcut);
  }

  private readonly handleGlobalShortcut = (event: KeyboardEvent) => {
    const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (!isShortcut) return;

    const target = event.target as HTMLElement | null;
    const isTypingTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable;

    event.preventDefault();

    if (this.searchRef) {
      if (!isTypingTarget) {
        this.searchRef.close();
      }
      return;
    }

    this.openGlobalSearch();
  };

  private openGlobalSearch(): void {
    if (this.searchRef) return;

    const ref = this.dialog.open(GlobalSearchModalComponent, {
      width: 'min(840px, calc(100vw - 24px))',
      maxHeight: '80vh',
      disableClose: false,
      data: {},
    });

    this.searchRef = ref;
    ref.closed.subscribe(() => {
      this.searchRef = null;
    });
  }
}
