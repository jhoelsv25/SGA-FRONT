import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { ActionConfig } from '@core/types/action-types';
import { HeaderConfig } from '@core/types/header-types';
import { SectionCourse } from '../../types/section-course-types';
import { SectionCourseApi } from '../section-course-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { SECTION_COURSES_HEADER_CONFIG } from '../../config/header.config';
import { SECTION_COURSES_ACTIONS } from '../../config/action.config';

interface StoreState {
  data: SectionCourse[];
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
  headerConfig: SECTION_COURSES_HEADER_CONFIG,
  actions: SECTION_COURSES_ACTIONS,
};

type CreatePayload = Parameters<SectionCourseApi['create']>[0];
type UpdatePayload = Parameters<SectionCourseApi['update']>[1];

export const SectionCourseStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(SectionCourseApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (res) => patchState(store, { data: res.data ?? [], total: res.total, loading: false }),
              error: (err) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar cursos por sección: ' + (err?.message ?? ''));
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
            const created = (res as { data?: SectionCourse }).data ?? (res as unknown as SectionCourse);
            patchState(store, { data: [created, ...store.data()], loading: false });
            toast.success('Curso asignado a sección correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al asignar: ' + (err?.message ?? ''));
          },
        }),
      );
      return obs as Observable<{ data: SectionCourse }>;
    },
    update: (id: string, payload: UpdatePayload) => {
      patchState(store, { loading: true });
      return api.update(id, payload).pipe(
        tap({
          next: (res) => {
            const updated = (res as { data?: SectionCourse }).data ?? (res as unknown as SectionCourse);
            patchState(store, {
              data: store.data().map((i) => (i.id === id ? updated : i)),
              loading: false,
            });
            toast.success('Actualizado correctamente');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al actualizar: ' + (err?.message ?? ''));
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
            toast.success('Asignación eliminada');
          },
          error: (err) => {
            patchState(store, { loading: false });
            toast.error('Error al eliminar: ' + (err?.message ?? ''));
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
