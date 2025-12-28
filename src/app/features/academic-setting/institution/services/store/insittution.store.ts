import { inject } from '@angular/core';
import { Toast } from '@core/services/toast';

import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { InstitutionApi } from '../api/institution-api';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Institution, InstitutionCreate, InstitutionUpdate } from '../../types/institution-types';
import { HEADER_CONFIG_INSTITUTION } from '../../config/header.config';
import { COLUMN_CONFIG_INSTITUTION } from '../../config/column.config';
import { ACTION_CONFIG_INSTITUTION } from '../../config/action.config';

type InstitutionState = {
  data: Institution[];
  institution: Institution | null;
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: InstitutionState = {
  data: [],
  institution: null,
  pagination: {
    page: 1,
    size: 10,
    total: 0,
  },
  loading: false,
  error: null,
  headerConfig: HEADER_CONFIG_INSTITUTION,
  actions: ACTION_CONFIG_INSTITUTION,
  columns: COLUMN_CONFIG_INSTITUTION,
};

export const InstitutionStore = signalStore(
  { providedIn: 'root' },
  withState<InstitutionState>(initialState),
  withMethods((store, toast = inject(Toast), api = inject(InstitutionApi)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (data) => {
                patchState(store, { data, loading: false, error: null });
              },
              error: (error) => {
                patchState(store, { loading: false, error: error.message });
                toast.error('Error loading institutions: ' + error.message);
              },
              complete: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
    create: (data: InstitutionCreate) => {
      patchState(store, { loading: true });
      return api.create(data).pipe(
        tap({
          next: (res) =>
            patchState(store, { data: [...store.data(), res.data], loading: false, error: null }),
          error: (error) => {
            patchState(store, { loading: false, error: error });
            toast.error('Error creating institution: ' + error);
          },
          complete: () => patchState(store, { loading: false }),
        }),
      );
    },
    update: (id: string, changes: InstitutionUpdate) => {
      patchState(store, { loading: true });
      return api.update(id, changes).pipe(
        tap({
          next: (res) => {
            const currentData = store.data();
            const updatedData = currentData.map((inst) => (inst.id === id ? res.data : inst));
            patchState(store, { data: updatedData, loading: false, error: null });
            toast.success('La institución ha sido actualizada exitosamente.');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error('Error updating institution: ' + error.message);
          },
          complete: () => patchState(store, { loading: false }),
        }),
      );
    },
    delete: rxMethod<string>(
      pipe(
        switchMap((id) => {
          patchState(store, { loading: true });
          return api.delete(id).pipe(
            tap({
              next: () => {
                const currentData = store.data();
                const updatedData = currentData.filter((inst) => inst.id !== id);
                patchState(store, { data: updatedData, loading: false, error: null });
                toast.success('La institución ha sido eliminada exitosamente.');
              },
              error: (error) => {
                patchState(store, { loading: false, error: error.message });
                toast.error('Error deleting institution: ' + error.message);
              },
              complete: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
  })),
  withHooks({
    onInit: (store) => {
      patchState(store, { loading: true });
      store.loadAll();
    },
  }),
);
