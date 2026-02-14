import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ScheduleApi } from '../api/schedule-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Schedule, ScheduleCreate, ScheduleUpdate } from '../../types/schedule-types';
import { SCHEDULE_HEADER_CONFIG } from '../../config/header.config';
import { SCHEDULE_COLUMN } from '../../config/column.config';
import { SCHEDULE_ACTIONS } from '../../config/action.config';

type State = {
  data: Schedule[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: State = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: SCHEDULE_HEADER_CONFIG,
  actions: SCHEDULE_ACTIONS,
  columns: SCHEDULE_COLUMN,
};

export const ScheduleStore = signalStore(
  { providedIn: 'root' },
  withState<State>(initialState),
  withMethods((store, api = inject(ScheduleApi), toast = inject(Toast)) => ({
    loadAll() {
      patchState(store, { loading: true, error: null });
      api.getAll().subscribe({
        next: (list) => {
          const data = Array.isArray(list) ? list : [];
          patchState(store, {
            data,
            pagination: { ...store.pagination(), total: data.length },
            loading: false,
            error: null,
          });
        },
        error: (err) => {
          patchState(store, { loading: false, error: err.message });
          toast.error('Error al cargar horarios: ' + err.message);
        },
      });
    },
    create(payload: ScheduleCreate) {
      patchState(store, { loading: true });
      api.create(payload).subscribe({
        next: (created) => {
          patchState(store, {
            data: [created, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success('Horario creado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: ScheduleUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (updated) => {
          const list = store.data().map((s) => (s.id === id ? updated : s));
          patchState(store, { data: list, loading: false, error: null });
          toast.success('Horario actualizado');
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
          const list = store.data().filter((s) => s.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Horario eliminado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al eliminar: ' + err.message);
        },
      });
    },
    setPagination(page: number, size: number) {
      patchState(store, {
        pagination: { page, size, total: store.data().length },
      });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll();
    },
  }),
);
