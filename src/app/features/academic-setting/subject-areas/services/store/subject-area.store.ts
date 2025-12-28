import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { SubjectArea } from '../../types/subject-area-types';
import { SubjectAreaApi } from '../subject-area-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { SUBJECT_AREAS_HEADER_CONFIG } from '../../config/header.config';
import { SUBJECT_AREAS_COLUMN } from '../../config/column.config';
import { SUBJECT_AREAS_ACTIONS } from '../../config/action.config';
import { ActionConfig } from '@core/types/action-types';

interface StoreState {
  data: SubjectArea[];
  loading: boolean;
  error: string | null;
  headerConfig: typeof SUBJECT_AREAS_HEADER_CONFIG;
  columns: typeof SUBJECT_AREAS_COLUMN;
  actions: ActionConfig[];
  selected: SubjectArea[];
  current: SubjectArea | null;
}

const initialState: StoreState = {
  data: [],
  loading: false,
  error: null,
  headerConfig: SUBJECT_AREAS_HEADER_CONFIG,
  columns: SUBJECT_AREAS_COLUMN,
  actions: SUBJECT_AREAS_ACTIONS,
  selected: [],
  current: null,
};

export const SubjectAreaStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(SubjectAreaApi), toast = inject(Toast)) => ({
    load: rxMethod<Record<string, unknown>>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          api.getAll(params).pipe(
            tap({
              next: (res) => {
                patchState(store, { data: res ?? [], loading: false });
              },
              error: () => {
                patchState(store, { loading: false });
                toast.error('Error cargando áreas curriculares');
              },
            }),
          ),
        ),
      ),
    ),
    create: (data: Partial<SubjectArea>) => {
      patchState(store, { loading: true });
      return api.create(data).pipe(
        tap({
          next: (res) => {
            patchState(store, { data: [res, ...store.data()], loading: false });
            toast.success('Área curricular creada');
          },
          error: (error: string) => {
            patchState(store, { loading: false, error });
            toast.error('Error creando área curricular');
          },
        }),
      );
    },
    update: (id: string, changes: Partial<SubjectArea>) => {
      patchState(store, { loading: true });
      return api.update(id, changes).pipe(
        tap({
          next: (res) => {
            patchState(store, {
              data: store.data().map((i) => (i.id === res.id ? res : i)),
              loading: false,
            });
            toast.success('Área curricular actualizada');
          },
          error: (error: string) => {
            patchState(store, { loading: false, error });
            toast.error('Error actualizando área curricular');
          },
        }),
      );
    },
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((id) =>
          api.delete(id).pipe(
            tap({
              next: () => {
                patchState(store, {
                  data: store.data().filter((i) => i.id !== id),
                  selected: [],
                  loading: false,
                });
                toast.success('Área curricular eliminada');
              },
              error: () => {
                patchState(store, { loading: false });
                toast.error('Error eliminando área curricular');
              },
            }),
          ),
        ),
      ),
    ),
    setSelected(selected: SubjectArea[]) {
      patchState(store, { selected });
    },
    setCurrent(item: SubjectArea | null) {
      patchState(store, { current: item });
    },
  })),
);
