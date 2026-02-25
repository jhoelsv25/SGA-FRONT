import { inject } from '@angular/core';
import { Params } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ReportApi } from '../report-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Report, ReportCreate, ReportUpdate } from '../../types/report-types';
import { REPORT_HEADER_CONFIG } from '../../config/header.config';
import { REPORT_COLUMN } from '../../config/column.config';
import { REPORT_ACTIONS } from '../../config/action.config';

type ReportState = {
  data: Report[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: ReportState = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: REPORT_HEADER_CONFIG,
  actions: REPORT_ACTIONS,
  columns: REPORT_COLUMN,
};

export const ReportStore = signalStore(
  { providedIn: 'root' },
  withState<ReportState>(initialState),
  withMethods((store, api = inject(ReportApi), toast = inject(Toast)) => ({
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
          toast.error('Error al cargar reportes: ' + err.message);
        },
      });
    },
    create(payload: ReportCreate) {
      patchState(store, { loading: true });
      return api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Reporte generado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al generar: ' + err.message);
        },
      });
    },
    update(id: string, payload: ReportUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((r) => (r.id === id ? res.data : r));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Reporte actualizado');
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
          const list = store.data().filter((r) => r.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Reporte eliminado');
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
