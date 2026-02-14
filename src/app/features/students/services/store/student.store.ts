import { inject } from '@angular/core';
import { PaginationType } from '@core/types/pagination-types';
import { Student, StudentCreate } from '@features/students/types/student-types';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { StudentApi } from '../api/student-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';

type studentState = {
  students: Student[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
};

export const initialStudentState: studentState = {
  students: [],
  pagination: {
    page: 1,
    size: 10,
    total: 0,
  },
  loading: false,
  error: null,
};

export const StudentStore = signalStore(
  { providedIn: 'root' },
  withState<studentState>(initialStudentState),
  withMethods((store, api = inject(StudentApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  students: response.data ?? [],
                  pagination: {
                    page: response.page ?? 1,
                    size: response.size ?? 10,
                    total: response.total ?? 0,
                  },
                  loading: false,
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
    create: (student: StudentCreate) => {
      patchState(store, { loading: true });
      return api.create(student).pipe(
        tap({
          next: (response) => {
            const currentStudents = store.students();
            patchState(store, { students: [response.data, ...currentStudents], loading: false });
            toast.success('Student created successfully');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error(error.message);
          },
        }),
      );
    },
    update: (id: string, student: Partial<Student>) => {
      patchState(store, { loading: true });
      return api.update(id, student).pipe(
        tap({
          next: (response) => {
            const currentStudents = store.students();
            const index = currentStudents.findIndex((s) => s.id === id);
            if (index > -1) {
              currentStudents[index] = response.data;
              patchState(store, { students: [...currentStudents], loading: false });
              toast.success('Student updated successfully');
            }
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
            const currentStudents = store.students();
            const updatedStudents = currentStudents.filter((s) => s.id !== id);
            patchState(store, { students: [...updatedStudents], loading: false });
            toast.success('Student deleted successfully');
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
