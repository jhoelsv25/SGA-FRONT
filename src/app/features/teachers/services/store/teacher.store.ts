import { inject } from '@angular/core';
import { PaginationType } from '@core/types/pagination-types';
import { Teacher, TeacherParams } from '@features/teachers/types/teacher-types';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { TeacherApi } from '../api/teacher-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

type TeacherState = {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
  filterParams: TeacherParams;
};

export const initialTeacherState: TeacherState = {
  teachers: [],
  selectedTeacher: null,
  pagination: {
    page: 1,
    size: 10,
    total: 0,
  },
  loading: false,
  error: null,
  filterParams: {},
};

export const TeacherStore = signalStore(
  { providedIn: 'root' },
  withState<TeacherState>(initialTeacherState),
  withMethods((store, api = inject(TeacherApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<TeacherParams | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  teachers: response.data ?? [],
                  pagination: {
                    page: response.page ?? 1,
                    size: response.size ?? 10,
                    total: response.total ?? 0,
                  },
                  loading: false,
                  filterParams: params || {},
                });
              },
              error: (error) => {
                patchState(store, { loading: false, error: error.message });
                toast.error(error.message);
              },
            }),
          );
        }),
      ),
    ),

    create: (teacher: Partial<Teacher>) => {
      patchState(store, { loading: true });
      return api.create(teacher).pipe(
        tap({
          next: (response) => {
            const currentTeachers = store.teachers();
            patchState(store, {
              teachers: [response.data, ...currentTeachers],
              loading: false,
            });
            toast.success('Teacher created successfully');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error(error.message);
          },
        }),
      );
    },

    update: (id: string, teacher: Partial<Teacher>) => {
      patchState(store, { loading: true });
      return api.update(id, teacher).pipe(
        tap({
          next: (response) => {
            const updatedTeachers = store.teachers().map((t) => (t.id === id ? response.data : t));
            patchState(store, {
              teachers: updatedTeachers,
              loading: false,
            });
            toast.success('Teacher updated successfully');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error(error.message);
          },
        }),
      );
    },

    delete: (id: string) => {
      patchState(store, { loading: true });
      return api.delete(id).pipe(
        tap({
          next: () => {
            const filteredTeachers = store.teachers().filter((t) => t.id !== id);
            patchState(store, {
              teachers: filteredTeachers,
              loading: false,
            });
            toast.success('Teacher deleted successfully');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error(error.message);
          },
        }),
      );
    },
  })),
);
