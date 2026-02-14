import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { Course } from '../../types/course-types';
import { CourseApi } from '../course-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

interface StoreState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: StoreState = {
  courses: [],
  loading: false,
  error: null,
  total: 0,
};

export const CourseStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(CourseApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, { 
                  courses: response.data, 
                  total: response.total, 
                  loading: false 
                });
              },
              error: (error) => {
                patchState(store, { loading: false, error: error.message });
                toast.error('Error al cargar cursos: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    create: (course: Partial<Course>) => {
      patchState(store, { loading: true });
      return api.create(course).pipe(
        tap({
          next: (response) => {
            const current = store.courses();
            patchState(store, { courses: [response.data, ...current], loading: false });
            toast.success('Curso creado correctamente');
          },
          error: (error) => {
            patchState(store, { loading: false });
            toast.error('Error al crear curso: ' + error.message);
          },
        }),
      );
    },
    update: (id: string, course: Partial<Course>) => {
      patchState(store, { loading: true });
      return api.update(id, course).pipe(
        tap({
          next: (response) => {
            const updated = store.courses().map(item => item.id === id ? response.data : item);
            patchState(store, { courses: updated, loading: false });
            toast.success('Curso actualizado correctamente');
          },
          error: (error) => {
            patchState(store, { loading: false });
            toast.error('Error al actualizar curso: ' + error.message);
          },
        }),
      );
    },
    delete: (id: string) => {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            const filtered = store.courses().filter(item => item.id !== id);
            patchState(store, { courses: filtered, loading: false });
            toast.success('Curso eliminado correctamente');
          },
          error: (error) => {
            patchState(store, { loading: false });
            toast.error('Error al eliminar curso: ' + error.message);
          },
        }),
      );
    },
  })),
);
