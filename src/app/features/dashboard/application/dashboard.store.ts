import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Toast } from '@core/services/toast';
import type { DashboardResponse } from '@features/dashboard/domain/dashboard-types';
import { DashboardApi } from '@features/dashboard/infrastructure/dashboard-api';

interface DashboardState {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>(initialState),
  withMethods((store, api = inject(DashboardApi), toast = inject(Toast)) => ({
    load: rxMethod<void>(
      pipe(
        switchMap(() => {
          patchState(store, { loading: true, error: null });
          return api.getDashboard().pipe(
            tap({
              next: (response) => {
                patchState(store, { data: response, loading: false });
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
  })),
);
