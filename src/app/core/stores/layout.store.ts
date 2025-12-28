import { computed, inject } from '@angular/core';
import { LocalStorage } from '@core/services/local-storage';
import { ThemeConfig } from '@core/types/layout-types';
import { signalStore, withState, withMethods, withComputed, patchState, withHooks } from '@ngrx/signals';


interface LayoutState {
  isShowAside: boolean;
  isShowNav: boolean;
  isSidebarCollapsed: boolean;
  titleAside: string;
  theme: ThemeConfig;
}

const initialState: LayoutState = {
  isShowAside: false,
  isSidebarCollapsed: false,
  isShowNav: false,
  titleAside: '',
  theme: 'system',
};

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    currentTheme: computed(() => store.theme()),
    isSystemTheme: computed(() => store.theme() === 'system'),
    isDark: computed(() => {
      const theme = store.theme();
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return theme === 'dark';
    }),
  })),
  withMethods((store, storageService = inject(LocalStorage)) => ({
    toggleTheme() {
      const currentTheme = store.theme();
      let newTheme: ThemeConfig;

      switch (currentTheme) {
        case 'light':
          newTheme = 'dark';
          break;
        case 'dark':
          newTheme = 'system';
          break;
        case 'system':
          newTheme = 'light';
          break;
        default:
          newTheme = 'system';
      }

      patchState(store, { theme: newTheme });
      storageService.set('theme', JSON.stringify({ theme: newTheme }));
      this.applyTheme();
    },

    syncWithSystem() {
      if (store.theme() !== 'system') {
        return;
      }

      this.applyTheme();
    },

    toggleNav() {
      patchState(store, { isShowNav: !store.isShowNav() });
    },

    toggleAside(type: string) {
      const currentType = store.titleAside();
      const isCurrentlyOpen = store.isShowAside();

      if (isCurrentlyOpen && currentType === type) {
        patchState(store, {
          isShowAside: false,
          titleAside: '',
        });
      } else {
        patchState(store, {
          titleAside: type,
          isShowAside: true,
        });
      }
    },
    closeAside() {
      patchState(store, {
        isShowAside: false,
        titleAside: '',
      });
    },
    toggleSidebar() {
      patchState(store, { isSidebarCollapsed: !store.isSidebarCollapsed() });
    },
    applyTheme() {
      queueMicrotask(() => {
        const theme = store.theme();
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.classList.remove('dark');
        }
      });
    },

    initTheme() {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const savedTheme = storageService.get<{ theme: ThemeConfig }>('theme');

      queueMicrotask(() => {
        if (savedTheme) {
          patchState(store, { theme: savedTheme.theme });
        } else {
          patchState(store, { theme: 'system' });
        }
        this.applyTheme();
      });

      const handleSystemThemeChange = () => {
        if (store.theme() === 'system') {
          this.applyTheme();
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
    },
  })),
  withHooks({
    onInit: (store) => {
      store.initTheme();
    },
  }),
);
