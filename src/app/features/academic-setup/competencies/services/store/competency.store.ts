import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { Competency } from '../../types/competency-types';
import { CompetencyApi } from '../competency-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

interface StoreState {
  competencies: Competency[];
  loading: boolean;
  total: number;
}

const initialState: StoreState = {
  competencies: [],
  loading: false,
  total: 0,
};

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
              next: (response) => {
                patchState(store, { 
                  competencies: response.data, 
                  total: response.total, 
                  loading: false 
                });
              },
              error: (error) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar competencias: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    // ... CRUD methods
  })),
);
