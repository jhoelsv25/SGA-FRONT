import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AttendanceApi } from '../attendance-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ApiParams } from '@core/types/pagination-types';
import { Attendance, BulkAttendanceRequest } from '../../types/attendance-types';

type AttendanceState = {
  attendances: Attendance[];
  loading: boolean;
  error: string | null;
};

export const initialAttendanceState: AttendanceState = {
  attendances: [],
  loading: false,
  error: null,
};

export const AttendanceStore = signalStore(
  { providedIn: 'root' },
  withState<AttendanceState>(initialAttendanceState),
  withMethods((store, api = inject(AttendanceApi), toast = inject(Toast)) => ({
    loadByFilter: rxMethod<ApiParams | null | undefined>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params ?? {}).pipe(
            tap({
              next: (response) => {
                patchState(store, { attendances: response.data, loading: false });
              },
              error: (error) => {
                patchState(store, { loading: false, error: error.message });
                toast.error('Error al cargar asistencias: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    saveBulk: (request: BulkAttendanceRequest) => {
      patchState(store, { loading: true });
      return api.saveBulk(request).pipe(
        tap({
          next: (response) => {
            patchState(store, { loading: false });
            if (response.success) {
              toast.success(response.message);
            } else {
              toast.error(response.message);
            }
          },
          error: (error) => {
            patchState(store, { loading: false });
            toast.error('Error al guardar asistencias: ' + error.message);
          },
        }),
      );
    },
  })),
);
