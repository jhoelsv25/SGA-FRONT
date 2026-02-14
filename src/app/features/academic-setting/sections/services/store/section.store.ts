import { inject } from '@angular/core';
import { Params } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { SectionApi } from '../api/section-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Section, SectionCreate, SectionUpdate } from '../../types/section-types';
import { SECTION_HEADER_CONFIG } from '../../config/header.config';
import { SECTION_COLUMN } from '../../config/column.config';
import { SECTION_ACTIONS } from '../../config/action.config';

type SectionState = {
  data: Section[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: SectionState = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: SECTION_HEADER_CONFIG,
  actions: SECTION_ACTIONS,
  columns: SECTION_COLUMN,
};

export const SectionStore = signalStore(
  { providedIn: 'root' },
  withState<SectionState>(initialState),
  withMethods((store, api = inject(SectionApi), toast = inject(Toast)) => ({
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
          toast.error('Error al cargar secciones: ' + err.message);
        },
      });
    },
    create(payload: SectionCreate) {
      patchState(store, { loading: true });
      return api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Sección creada');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: SectionUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((s) => (s.id === id ? res.data : s));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Sección actualizada');
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
          toast.success('Sección eliminada');
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
