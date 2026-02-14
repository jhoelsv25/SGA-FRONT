import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { Enrollment } from '../../types/enrollment-types';
import { EnrollmentApi } from '../enrollment-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

interface StoreState {
  enrollments: Enrollment[];
  loading: boolean;
  total: number;
}

const initialState: StoreState = {
  enrollments: [],
  loading: false,
  total: 0,
};

export const EnrollmentStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(EnrollmentApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, { 
                  enrollments: response.data, 
                  total: response.total, 
                  loading: false 
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
    // ... CRUD methods
  })),
);
