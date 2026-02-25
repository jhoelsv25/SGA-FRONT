import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { Enrollment } from '../../types/enrollment-types';
import { EnrollmentApi } from '../enrollment-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { PaginationType } from '@core/types/pagination-types';
import { ENROLLMENT_HEADER_CONFIG } from '../../config/header.config';
import { ENROLLMENT_COLUMN } from '../../config/column.config';
import { ENROLLMENT_ACTIONS } from '../../config/action.config';
import type { CreateEnrollmentDto, EnrollmentUpdateDto } from '../../types/enrollment-types';

interface StoreState {
  enrollments: Enrollment[];
  loading: boolean;
  total: number;
  pagination: PaginationType;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
}

const initialState: StoreState = {
  enrollments: [],
  loading: false,
  total: 0,
  pagination: { page: 1, size: 10, total: 0 },
  headerConfig: ENROLLMENT_HEADER_CONFIG,
  actions: ENROLLMENT_ACTIONS,
  columns: ENROLLMENT_COLUMN,
};

export const EnrollmentStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(EnrollmentApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params ?? {}).pipe(
            tap({
              next: (response) => {
                const list = response.data ?? [];
                patchState(store, {
                  enrollments: list,
                  total: response.total ?? list.length,
                  pagination: { ...store.pagination(), total: list.length },
                  loading: false,
                });
              },
              error: (error) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar inscripciones: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    create(payload: CreateEnrollmentDto) {
      patchState(store, { loading: true });
      api.create(payload).subscribe({
        next: (res) => {
          const created = res.data;
          const list = [created, ...store.enrollments()];
          patchState(store, {
            enrollments: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
          });
          toast.success('Inscripción creada');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al crear: ' + (err?.message ?? ''));
        },
      });
    },
    update(id: string, payload: EnrollmentUpdateDto) {
      patchState(store, { loading: true });
      api.update(id, payload).subscribe({
        next: (res) => {
          const list = store.enrollments().map((e) => (e.id === id ? res.data : e));
          patchState(store, { enrollments: list, loading: false });
          toast.success('Inscripción actualizada');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al actualizar: ' + (err?.message ?? ''));
        },
      });
    },
    delete(id: string) {
      patchState(store, { loading: true });
      api.delete(id).subscribe({
        next: () => {
          const list = store.enrollments().filter((e) => e.id !== id);
          patchState(store, {
            enrollments: list,
            pagination: { ...store.pagination(), total: list.length },
            loading: false,
          });
          toast.success('Inscripción eliminada');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error('Error al eliminar: ' + (err?.message ?? ''));
        },
      });
    },
    setPagination(page: number, size: number) {
      const total = store.enrollments().length;
      patchState(store, { pagination: { page, size, total } });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll({});
    },
  }),
);
