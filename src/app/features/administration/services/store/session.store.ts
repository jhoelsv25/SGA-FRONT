import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Session, SessionApi } from '../api/session-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';
import { PaginationType } from '@core/types/pagination-types';

type SessionState = {
  sessions: Session[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;
};

const initialState: SessionState = {
  sessions: [],
  pagination: { page: 1, size: 20, total: 0 },
  loading: false,
  error: null,
};

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(initialState),
  withMethods((store, api = inject(SessionApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  sessions: response.data,
                  pagination: { ...store.pagination(), total: response.total },
                  loading: false,
                });
              },
              error: (err) => {
                patchState(store, { loading: false, error: err.message });
                toast.error('Error al cargar las sesiones');
              },
            }),
          );
        }),
      ),
    ),
    delete: (id: string) => {
      patchState(store, { loading: true });
      api.delete(id).subscribe({
        next: () => {
          const currentSessions = store.sessions();
          patchState(store, { 
            sessions: currentSessions.filter(s => s.id !== id), 
            loading: false 
          });
          toast.success('Sesión revocada exitosamente');
        },
        error: (err) => {
          patchState(store, { loading: false });
          toast.error(err.message || 'Error al revocar la sesión');
        }
      });
    },
  })),
);
