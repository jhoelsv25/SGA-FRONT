import { inject } from '@angular/core';
import { DataSourceColumn } from '@core/types/data-source-types';
import { HeaderConfig } from '@core/types/header-types';
import { PaginationType } from '@core/types/pagination-types';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { YearAcademicApi } from '../api/year-academic-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';
import { ActionConfig } from '@core/types/action-types';
import { YearAcademic } from '../../types/year-academi-types';
import { YEAR_ACADEMIC_HEADER_CONFIG } from '../../config/header.config';
import { YEAR_ACADEMIC_COLUMN } from '../../config/column.config';
import { YEAR_ACADEMIC_ACTIONS } from '../../config/action.config';

interface StoreState {
  data: YearAcademic[];
  pagination: PaginationType;
  loading: boolean;
  error: string | null;

  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];

  selected: YearAcademic[];
  current: YearAcademic | null;
}

const initialState: StoreState = {
  data: [],
  pagination: {
    page: 1,
    size: 10,
    total: 0,
  },
  loading: false,
  error: null,

  headerConfig: YEAR_ACADEMIC_HEADER_CONFIG,
  columns: YEAR_ACADEMIC_COLUMN,
  actions: YEAR_ACADEMIC_ACTIONS,

  selected: [],
  current: null,
};

export const YearAcademicStore = signalStore(
  { providedIn: 'root' },

  withState<StoreState>(initialState),

  withMethods((store, api = inject(YearAcademicApi), toast = inject(Toast)) => ({
    load: rxMethod<Params>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          api.getAll(params).pipe(
            tap({
              next: (res) => {
                patchState(store, {
                  data: res.data ?? [],
                  pagination: {
                    page: res.page ?? 1,
                    size: res.size ?? 10,
                    total: res.total ?? 0,
                  },
                  loading: false,
                });
              },
              error: () => {
                patchState(store, { loading: false });
                toast.error('Error loading academic years');
              },
            }),
          ),
        ),
      ),
    ),

    create: (data: Partial<YearAcademic>) => {
      patchState(store, { loading: true });
      return api.create(data).pipe(
        tap({
          next: (res) => {
            patchState(store, {
              data: [res.data, ...store.data()],
              loading: false,
            });
            toast.success('Academic year created');
          },
          error: (error: string) => {
            patchState(store, { loading: false, error });
            toast.error('Error creating academic year');
          },
        }),
      );
    },

    update: (id: string, changes: Partial<YearAcademic>) => {
      patchState(store, { loading: true });
      return api.update(id, changes).pipe(
        tap({
          next: (res) => {
            patchState(store, {
              data: store.data().map((i) => (i.id === res.data.id ? res.data : i)),
              loading: false,
            });
            toast.success('Academic year updated');
          },
          error: (error: string) => {
            patchState(store, { loading: false, error });
            toast.error('Error updating academic year');
          },
        }),
      );
    },

    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((id) =>
          api.delete(id).pipe(
            tap({
              next: () => {
                patchState(store, {
                  data: store.data().filter((i) => i.id !== id),
                  selected: [],
                  loading: false,
                });
                toast.success('Academic year(s) deleted');
              },
              error: () => {
                patchState(store, { loading: false });
                toast.error('Error deleting academic years');
              },
            }),
          ),
        ),
      ),
    ),

    setSelected(selected: YearAcademic[]) {
      patchState(store, { selected });
    },

    setCurrent(item: YearAcademic | null) {
      patchState(store, { current: item });
    },
  })),

  withHooks({
    onInit(store) {
      store.load({});
    },
  }),
);
