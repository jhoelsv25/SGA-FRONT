import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Role, RoleApi } from '../api/role-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';
import { PaginationType } from '@core/types/pagination-types';

type RoleState = {
  roles: Role[];
  selectedRole: Role | null;
  selectedRoleModules: unknown[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
};

const initialState: RoleState = {
  roles: [],
  selectedRole: null,
  selectedRoleModules: [],
  pagination: { page: 1, size: 20, total: 0 },
  loading: false,
  error: null,
};

export const RoleStore = signalStore(
  { providedIn: 'root' },
  withState<RoleState>(initialState),
  withMethods((store, api = inject(RoleApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  roles: response.data,
                  pagination: { ...store.pagination(), total: response.total },
                  loading: false,
                });
              },
              error: (err) => {
                patchState(store, { loading: false, error: err.message });
                toast.error('Error loading roles');
              },
            }),
          );
        }),
      ),
    ),
    selectRole: (role: Role) => {
      patchState(store, { selectedRole: role, loading: true });
      api.getModules(role.id).subscribe({
        next: (res) => {
          patchState(store, { selectedRoleModules: res.modules, loading: false });
        },
        error: () => {
          patchState(store, { loading: false });
          toast.error('Error loading role permissions');
        },
      });
    },
    selectRoleById: (id: string) => {
      patchState(store, { loading: true });
      api.getById(id).subscribe({
        next: (role) => {
          patchState(store, { selectedRole: role });
          api.getModules(id).subscribe({
            next: (res) => {
              patchState(store, { selectedRoleModules: res.modules, loading: false });
            },
            error: () => {
              patchState(store, { loading: false });
              toast.error('Error loading role permissions');
            },
          });
        },
        error: () => {
          patchState(store, { loading: false });
          toast.error('Error loading role');
        },
      });
    },
    updatePermissions: (id: string, permissionIds: string[]) => {
      patchState(store, { loading: true });
      return api.update(id, { permissionIds }).pipe(
        tap({
          next: () => {
            patchState(store, { loading: false });
            toast.success('Permissions updated successfully');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message || 'Error updating permissions');
          },
        }),
      );
    },
    create: (role: Partial<Role>) => {
      patchState(store, { loading: true });
      return api.create(role).pipe(
        tap({
          next: () => {
            toast.success('Role created');
            // Reload all
            // this.loadAll(); // Need to handle rxMethod call properly if needed, usually we just reload
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message);
          },
        }),
      );
    },
    update: (id: string, role: Partial<Role>) => {
      patchState(store, { loading: true });
      return api.update(id, role).pipe(
        tap({
          next: () => {
            toast.success('Role updated');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message);
          },
        }),
      );
    },
    delete: (id: string) => {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            const currentRoles = store.roles();
            patchState(store, { roles: currentRoles.filter((r) => r.id !== id), loading: false });
            toast.success('Role deleted successfully');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message);
          },
        }),
      );
    },
  })),
);
