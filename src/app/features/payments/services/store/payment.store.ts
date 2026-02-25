import { inject } from '@angular/core';
import { Params } from '@angular/router';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { PaymentApi } from '../payment-api';
import { Toast } from '@core/services/toast';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { Payment, PaymentCreate, PaymentUpdate } from '../../types/payment-types';
import { PAYMENT_HEADER_CONFIG } from '../../config/header.config';
import { PAYMENT_COLUMN } from '../../config/column.config';
import { PAYMENT_ACTIONS } from '../../config/action.config';

type PaymentState = {
  data: Payment[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
};

const initialState: PaymentState = {
  data: [],
  pagination: { page: 1, size: 10, total: 0 },
  loading: false,
  error: null,
  headerConfig: PAYMENT_HEADER_CONFIG,
  actions: PAYMENT_ACTIONS,
  columns: PAYMENT_COLUMN,
};

export const PaymentStore = signalStore(
  { providedIn: 'root' },
  withState<PaymentState>(initialState),
  withMethods((store, api = inject(PaymentApi), toast = inject(Toast)) => ({
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
          toast.error('Error al cargar pagos: ' + err.message);
        },
      });
    },
    create(payload: PaymentCreate) {
      patchState(store, { loading: true });
      return api.create(payload).subscribe({
        next: (res) => {
          patchState(store, {
            data: [res.data, ...store.data()],
            loading: false,
            error: null,
          });
          toast.success(res.message ?? 'Pago registrado');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + err.message);
        },
      });
    },
    update(id: string, payload: PaymentUpdate) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.data().map((p) => (p.id === id ? res.data : p));
          patchState(store, { data: list, loading: false, error: null });
          toast.success(res.message ?? 'Pago actualizado');
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
          const list = store.data().filter((p) => p.id !== id);
          patchState(store, {
            data: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
            error: null,
          });
          toast.success('Pago eliminado');
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
