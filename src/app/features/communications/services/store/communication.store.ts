import { inject } from '@angular/core';
import { Params } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { CommunicationApi } from '../communication-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import {
  Communication,
  CommunicationCreate,
  CommunicationUpdate,
} from '../../types/communication-types';
import { COMMUNICATION_HEADER_CONFIG } from '../../config/header.config';
import { COMMUNICATION_COLUMN } from '../../config/column.config';
import { COMMUNICATION_ACTIONS } from '../../config/action.config';

type CommunicationState = {
  data: Communication[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: CommunicationState = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: COMMUNICATION_HEADER_CONFIG,
  actions: COMMUNICATION_ACTIONS,
  columns: COMMUNICATION_COLUMN,
};

export const CommunicationStore = signalStore(
  { providedIn: 'root' },
  withState<CommunicationState>(initialState),
  withMethods((store, api = inject(CommunicationApi), toast = inject(Toast)) => ({
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
          toast.error('Error al cargar comunicaciones: ' + err.message);
        },
      });
    },
    create(payload: CommunicationCreate) {
      patchState(store, { loading: true });
      return api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Comunicación creada');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: CommunicationUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((c) => (c.id === id ? res.data : c));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Comunicación actualizada');
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
          const list = store.data().filter((c) => c.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Comunicación eliminada');
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
