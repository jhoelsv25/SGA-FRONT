import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Permission, PermissionApi } from '../api/permission-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';

type PermissionState = {
  permissions: Permission[];
  total: number;
  loading: boolean;
  error: string | null;
};

const initialState: PermissionState = {
  permissions: [],
  total: 0,
  loading: false,
  error: null,
};

export const PermissionStore = signalStore(
  { providedIn: 'root' },
  withState<PermissionState>(initialState),
  withMethods((store, api = inject(PermissionApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  permissions: response.data,
                  total: response.total,
                  loading: false,
                });
              },
              error: (err) => {
                patchState(store, { loading: false, error: err.message });
                toast.error('Error loading permissions');
              },
            }),
          );
        }),
      ),
    ),
    create: (permission: Partial<Permission>) => {
      patchState(store, { loading: true });
      return api.create(permission).pipe(
        tap({
          next: () => {
            toast.success('Permiso creado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message || 'Error al crear el permiso');
          }
        })
      );
    },
    update: (id: string, permission: Partial<Permission>) => {
      patchState(store, { loading: true });
      return api.update(id, permission).pipe(
        tap({
          next: () => {
            toast.success('Permiso actualizado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message || 'Error al actualizar el permiso');
          }
        })
      );
    },
    delete: (id: string) => {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            const current = store.permissions();
            patchState(store, { 
              permissions: current.filter(p => p.id !== id),
              total: store.total() - 1,
              loading: false 
            });
            toast.success('Permiso eliminado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error(err.message || 'Error al eliminar el permiso');
          }
        })
      );
    },
  })),
);
