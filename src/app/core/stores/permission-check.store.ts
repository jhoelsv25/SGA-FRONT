import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { AuthStore } from '@auth/services/store/auth.store';
import { Module } from '@auth/types/auth-type';

// Tipo genérico para acciones con permisos opcionales
type WithPermission = {
  permission?: string;
  permissions?: string[];
};

export const PermissionCheckStore = signalStore(
  { providedIn: 'root' },
  withComputed((store, authStore = inject(AuthStore)) => ({
    // Módulos aplanados (incluyendo hijos)
    allModules: computed(() => {
      const modules = authStore.modules();
      const flattenModules = (mods: Module[]): Module[] => {
        return mods.reduce((acc: Module[], mod: Module) => {
          acc.push(mod);
          if (mod.children && Array.isArray(mod.children)) {
            acc.push(...flattenModules(mod.children));
          }
          return acc;
        }, [] as Module[]);
      };
      return flattenModules(modules);
    }),

    // ⭐ NUEVO: Set de todos los permisos para búsqueda O(1)
    allPermissions: computed(() => {
      const modules = authStore.modules();
      const perms = new Set<string>();

      const extractPerms = (mods: Module[]): void => {
        for (const mod of mods) {
          mod.permissions?.forEach((p) => perms.add(p));
          if (mod.children) extractPerms(mod.children);
        }
      };

      extractPerms(modules);
      return perms;
    }),

    // Usuario actual
    currentUser: computed(() => authStore.currentUser()),
  })),

  withMethods((store) => ({
    findModule(resource: string): Module | undefined {
      return store
        .allModules()
        .find(
          (m) =>
            m.name.toLowerCase() === resource.toLowerCase() ||
            m.path.toLowerCase().includes(resource.toLowerCase()),
        );
    },

    /**
     * Verifica si tiene un permiso específico
     * @param resource - Nombre o path del módulo
     * @param permission - Permiso a verificar (write, read, update, delete)
     */
    can(resource: string, permission: string): boolean {
      if (!store.currentUser()?.role) {
        return false;
      }

      const module = this.findModule(resource);
      if (!module) {
        return false;
      }

      const fullPermission = `${resource}:${permission}`;

      const hasPermission =
        module.permissions.includes(permission) ||
        module.permissions.includes(fullPermission) ||
        module.permissions.some((p) => p.endsWith(`:${permission}`));

      return hasPermission;
    },

    /**
     * Signal computado para verificar permiso (reactivo)
     */
    canSignal(resource: string, permission: string) {
      return computed(() => this.can(resource, permission));
    },

    /**
     * Obtiene todos los permisos de un módulo
     */
    getPermissions(resource: string): string[] {
      const module = this.findModule(resource);
      return module?.permissions || [];
    },

    /**
     * Verifica múltiples permisos (AND - todos deben cumplirse)
     */
    canAll(resource: string, permissions: string[]): boolean {
      return permissions.every((permission) => this.can(resource, permission));
    },

    /**
     * Verifica múltiples permisos (OR - al menos uno debe cumplirse)
     */
    canAny(resource: string, permissions: string[]): boolean {
      return permissions.some((permission) => this.can(resource, permission));
    },

    // =============================================
    // ⭐ NUEVOS MÉTODOS PARA FILTRAR ACCIONES
    // =============================================

    /**
     * Verifica si tiene un permiso exacto (formato "resource:action")
     * @param permission - Permiso completo ej: "users:delete"
     */
    has(permission: string): boolean {
      return store.allPermissions().has(permission);
    },

    /**
     * Verifica si tiene AL MENOS UNO de los permisos
     * @param permissions - Lista de permisos
     */
    hasAny(...permissions: string[]): boolean {
      return permissions.some((p) => this.has(p));
    },

    /**
     * Verifica si tiene TODOS los permisos
     * @param permissions - Lista de permisos
     */
    hasAll(...permissions: string[]): boolean {
      return permissions.every((p) => this.has(p));
    },

    /**
     * ⭐ Filtra acciones según permisos del usuario
     * Funciona con HeaderAction, DataSourceAction, o cualquier objeto con permission/permissions
     * @param actions - Array de acciones a filtrar
     * @returns Solo las acciones para las que el usuario tiene permiso
     *
     * @example
     * // En el componente:
     * private allActions: DataSourceAction[] = [
     *   { key: 'edit', label: 'Editar', permission: 'users:update' },
     *   { key: 'delete', label: 'Eliminar', permission: 'users:delete' },
     * ];
     *
     * tableActions = computed(() =>
     *   this.permissionStore.filterActions(this.allActions)
     * );
     */
    filterActions<T extends WithPermission>(actions: T[]): T[] {
      return actions.filter((action) => {
        // Sin permiso definido = siempre visible
        if (!action.permission && !action.permissions) return true;
        // Permiso único
        if (action.permission) return this.has(action.permission);
        // Múltiples permisos (cualquiera)
        if (action.permissions) return this.hasAny(...action.permissions);
        return false;
      });
    },

    /**
     * ⭐ Signal computado que filtra acciones (reactivo)
     * Se actualiza automáticamente si cambian los permisos
     * @param actions - Array de acciones a filtrar
     *
     * @example
     * tableActions = this.permissionStore.filterActionsSignal(this.allActions);
     */
    filterActionsSignal<T extends WithPermission>(actions: T[]) {
      return computed(() => this.filterActions(actions));
    },

    /**
     * ⭐ Verifica si puede ejecutar una acción específica
     * Útil para validación antes de ejecutar
     * @param action - Acción a verificar
     *
     * @example
     * if (this.permissionStore.canExecute(action)) {
     *   action.action?.(row);
     * }
     */
    canExecute<T extends WithPermission>(action: T): boolean {
      if (!action.permission && !action.permissions) return true;
      if (action.permission) return this.has(action.permission);
      if (action.permissions) return this.hasAny(...action.permissions);
      return false;
    },
  })),
);
