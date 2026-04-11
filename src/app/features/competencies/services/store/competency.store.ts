import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { ActionConfig } from '@core/types/action-types';
import { HeaderConfig } from '@core/types/header-types';
import { Competency } from '../../types/competency-types';
import { CompetencyApi } from '../competency-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { COMPETENCIES_HEADER_CONFIG } from '../../config/header.config';
import { COMPETENCIES_ACTIONS } from '../../config/action.config';

interface StoreState {
  data: Competency[];
  loading: boolean;
  error: string | null;
  total: number;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
}

const initialState: StoreState = {
  data: [],
  loading: false,
  error: null,
  total: 0,
  headerConfig: COMPETENCIES_HEADER_CONFIG,
  actions: COMPETENCIES_ACTIONS,
};

type CreatePayload = {
  code: string;
  name: string;
  description?: string;
  expectedAchievement?: string;
  course: string;
};
type UpdatePayload = Partial<CreatePayload>;

export const CompetencyStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(CompetencyApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (res) =>
                patchState(store, { data: res.data ?? [], total: res.total, loading: false }),
              error: (err) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar competencias: ' + (err?.message ?? ''));
              },
            }),
          );
        }),
      ),
    ),
    create: (payload: CreatePayload) => {
      patchState(store, { loading: true });
      const obs = api.create(payload).pipe(
        tap({
          next: (res) => {
            patchState(store, { data: [res.data, ...store.data()], loading: false });
            toast.success('Competencia creada correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al crear competencia: ' + (err?.message ?? ''));
          },
        }),
      );
      return obs as Observable<{ data: Competency }>;
    },
    update: (id: string, payload: UpdatePayload) => {
      patchState(store, { loading: true });
      return api.update(id, payload).pipe(
        tap({
          next: (res) => {
            patchState(store, {
              data: store.data().map((i) => (i.id === id ? res.data : i)),
              loading: false,
            });
            toast.success('Competencia actualizada correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al actualizar competencia: ' + (err?.message ?? ''));
          },
        }),
      );
    },
    delete: (id: string) => {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            patchState(store, { data: store.data().filter((i) => i.id !== id), loading: false });
            toast.success('Competencia eliminada correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al eliminar competencia: ' + (err?.message ?? ''));
          },
        }),
      );
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll({});
    },
  }),
);
