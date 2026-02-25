import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { PaginationType } from '@core/types/pagination-types';
import type { Period } from '../../types/period-types';
import { tap } from 'rxjs';
import { PeriodApi } from '../period-api';
import { Toast } from '@core/services/toast';
import { PERIOD_HEADER_CONFIG } from '../../config/header.config';
import { PERIOD_COLUMNS } from '../../config/column.config';
import { PERIOD_ACTIONS } from '../../config/action.config';

interface PeriodState {
  periods: Period[];
  loading: boolean;
  total: number;
  headerConfig: HeaderConfig;
  columns: DataSourceColumn[];
  actions: ActionConfig[];
  pagination: PaginationType;
}

const initialState: PeriodState = {
  periods: [],
  loading: false,
  total: 0,
  headerConfig: PERIOD_HEADER_CONFIG,
  columns: PERIOD_COLUMNS,
  actions: PERIOD_ACTIONS,
  pagination: { page: 1, size: 10, total: 0 },
};

export const PeriodStore = signalStore(
  { providedIn: 'root' },
  withState<PeriodState>(initialState),
  withMethods((store, api = inject(PeriodApi), toast = inject(Toast)) => ({
    loadAll(params?: ApiParams) {
      patchState(store, { loading: true });
      api.getAll(params ?? {}).subscribe({
        next: (res) => {
          patchState(store, {
            periods: res.data,
            total: res.total,
            loading: false,
            pagination: { ...store.pagination(), total: res.total },
          });
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al cargar períodos: ' + err.message);
        },
      });
    },
    create(period: Partial<Period>) {
      patchState(store, { loading: true });
      return api.create(period).pipe(
        tap({
          next: (res) => {
            patchState(store, { periods: [res.data, ...store.periods()], loading: false });
            toast.success('Período creado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al crear período: ' + err.message);
          },
        })
      );
    },
    update(id: string, period: Partial<Period>) {
      patchState(store, { loading: true });
      return api.update(id, period).pipe(
        tap({
          next: (res) => {
            patchState(store, {
              periods: store.periods().map((p) => (p.id === id ? res.data : p)),
              loading: false,
            });
            toast.success('Período actualizado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al actualizar período: ' + err.message);
          },
        })
      );
    },
    delete(id: string) {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            patchState(store, {
              periods: store.periods().filter((p) => p.id !== id),
              loading: false,
            });
            toast.success('Período eliminado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al eliminar período: ' + err.message);
          },
        })
      );
    },
    setPagination(page: number, size: number) {
      patchState(store, {
        pagination: { page, size, total: store.pagination().total },
      });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll();
    },
  })
);
