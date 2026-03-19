import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuditLog, AuditApi } from '../api/audit-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';

type AuditState = {
  logs: AuditLog[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuditState = {
  logs: [],
  nextCursor: null,
  loading: false,
  error: null,
};

export const AuditStore = signalStore(
  { providedIn: 'root' },
  withState<AuditState>(initialState),
  withMethods((store, api = inject(AuditApi), toast = inject(Toast)) => ({
    loadInitial: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true, logs: [], nextCursor: null });
          return api.getAll({ ...params, limit: 50 }).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  logs: response.data,
                  nextCursor: response.nextCursor,
                  loading: false,
                });
              },
              error: (err) => {
                patchState(store, { loading: false, error: err.message });
                toast.error('Error loading audit logs');
              },
            }),
          );
        }),
      ),
    ),
    loadMore: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          if (!store.nextCursor()) return [];
          
          patchState(store, { loading: true });
          
          const cursorParams: Record<string, string | number | boolean> = {
            ...(params as Record<string, string | number | boolean>),
            limit: 50,
          };
          const cursor = store.nextCursor();
          if (cursor) cursorParams['cursor'] = cursor;

          return api.getAll(cursorParams).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  logs: [...store.logs(), ...response.data],
                  nextCursor: response.nextCursor,
                  loading: false,
                });
              },
              error: (err) => {
                patchState(store, { loading: false, error: err.message });
                toast.error('Error loading more logs');
              },
            }),
          );
        }),
      ),
    ),
  })),
);
