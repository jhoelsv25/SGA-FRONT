import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { GradeLevelApi } from '../api/grade-level-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { GradeLevel, GradeLevelCreate, GradeLevelUpdate } from '../../types/grade-level-types';
import { GRADE_LEVEL_HEADER_CONFIG } from '../../config/header.config';
import { GRADE_LEVEL_COLUMN } from '../../config/column.config';
import { GRADE_LEVEL_ACTIONS } from '../../config/action.config';

type State = {
  data: GradeLevel[];
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
  headerConfig: GRADE_LEVEL_HEADER_CONFIG,
  actions: GRADE_LEVEL_ACTIONS,
  columns: GRADE_LEVEL_COLUMN,
};

export const GradeLevelStore = signalStore(
  { providedIn: 'root' },
  withState<State>(initialState),
  withMethods((store, api = inject(GradeLevelApi), toast = inject(Toast)) => ({
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
          toast.error('Error al cargar niveles: ' + err.message);
        },
      });
    },
    create(payload: GradeLevelCreate) {
      patchState(store, { loading: true });
      api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Nivel creado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: GradeLevelUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((g) => (g.id === id ? res.data : g));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Nivel actualizado');
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
          const list = store.data().filter((g) => g.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Nivel eliminado');
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
