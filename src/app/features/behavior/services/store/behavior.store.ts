import { inject } from '@angular/core';
import { Params } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { BehaviorApi } from '../behavior-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Behavior, BehaviorCreate, BehaviorUpdate } from '../../types/behavior-types';
import { BEHAVIOR_HEADER_CONFIG } from '../../config/header.config';
import { BEHAVIOR_COLUMN } from '../../config/column.config';
import { BEHAVIOR_ACTIONS } from '../../config/action.config';

type BehaviorState = {
  data: Behavior[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: BehaviorState = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: BEHAVIOR_HEADER_CONFIG,
  actions: BEHAVIOR_ACTIONS,
  columns: BEHAVIOR_COLUMN,
};

export const BehaviorStore = signalStore(
  { providedIn: 'root' },
  withState<BehaviorState>(initialState),
  withMethods((store, api = inject(BehaviorApi), toast = inject(Toast)) => ({
    loadAll(params?: Params) {
      patchState(store, { loading: true, error: null });
      api.getAll(params ?? {}).subscribe({
        next: (res) => {
          const list = res.data ?? [];
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
        },
        error: (err) => {
          patchState(store, { loading: false, error: err.message });
          toast.error('Error al cargar conducta: ' + err.message);
        },
      });
    },
    create(payload: BehaviorCreate) {
      patchState(store, { loading: true });
      return api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Registro creado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: BehaviorUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((b) => (b.id === id ? res.data : b));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Registro actualizado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al actualizar: ' + err.message);
        },
      });
    },
    delete(id: string) {
      patchState(store, { loading: true });
      api.delete(id).subscribe({
        next: () => {
          const list = store.data().filter((b) => b.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Registro eliminado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al eliminar: ' + err.message);
        },
      });
    },
    setPagination(page: number, size: number) {
      const total = store.data().length;
      patchState(store, { pagination: { page, size, total } });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll();
    },
  }),
);
