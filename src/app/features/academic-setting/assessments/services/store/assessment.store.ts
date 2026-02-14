import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiParams } from '@core/types/pagination-types';
import { Assessment, BulkScoreRequest, AssessmentScore } from '../../types/assessment-types';
import { AssessmentApi } from '../assessment-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

interface StoreState {
  assessments: Assessment[];
  activeScores: AssessmentScore[];
  loading: boolean;
  total: number;
}

const initialState: StoreState = {
  assessments: [],
  activeScores: [],
  loading: false,
  total: 0,
};

export const AssessmentStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods((store, api = inject(AssessmentApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, { 
                  assessments: response.data, 
                  total: response.total, 
                  loading: false 
                });
              },
              error: (error) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar evaluaciones: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    loadScores: rxMethod<string>(
      pipe(
        switchMap((assessmentId) => {
          patchState(store, { loading: true });
          return api.getScoresByAssessment(assessmentId).pipe(
            tap({
              next: (response) => {
                patchState(store, { activeScores: response.data, loading: false });
              },
              error: (error) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar notas: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    saveScores: (request: BulkScoreRequest) => {
      patchState(store, { loading: true });
      return api.saveScoresBulk(request).pipe(
        tap({
          next: () => {
            patchState(store, { loading: false });
            toast.success('Notas guardadas correctamente');
          },
          error: (error) => {
            patchState(store, { loading: false });
            toast.error('Error al guardar notas: ' + error.message);
          },
        }),
      );
    },
  })),
);
