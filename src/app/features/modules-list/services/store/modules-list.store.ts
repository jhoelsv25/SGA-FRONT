import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { tap } from 'rxjs';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { CursorPagination } from '@core/types/pagination-types';
import { ModuleListItem, ModulesListCursorResponse } from '../../types/modules-list-types';
import { ModulesListApi } from '../api/modules-list-api';
import { Toast } from '@core/services/toast';

type State = {
  data: ModuleListItem[];
  loading: boolean;
  error: string | null;
  headerConfig: HeaderConfig;
  actions: ActionConfig[];
  columns: DataSourceColumn[];
  cursorPagination: CursorPagination | null;
};

const LIMIT = 20;

export const ModulesListStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    data: [],
    loading: false,
    error: null,
    headerConfig: {
      title: 'Módulos del sistema',
      subtitle: 'Listado con paginación por cursor (ideal para muchos datos)',
    },
    actions: [
      { key: 'refresh', label: 'Actualizar', typeAction: 'header', icon: 'fas fa-sync-alt', color: 'primary' },
    ],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'key', label: 'Clave' },
      { key: 'path', label: 'Ruta' },
      { key: 'order', label: 'Orden', type: 'number' },
      { key: 'visibility', label: 'Visibilidad' },
      { key: 'isActive', label: 'Activo', type: 'boolean' },
    ],
    cursorPagination: null,
  }),
  withMethods((store, api = inject(ModulesListApi), toast = inject(Toast)) => ({
    loadWithCursor() {
      patchState(store, { loading: true, error: null });
      api
        .getAll({ mode: 'cursor', size: LIMIT })
        .pipe(
          tap({
            next: (res) => {
              const cursorRes = res as unknown as ModulesListCursorResponse;
              if (cursorRes.nextCursor !== undefined) {
                patchState(store, {
                  data: cursorRes.data,
                  loading: false,
                  error: null,
                  cursorPagination: {
                    nextCursor: cursorRes.nextCursor ?? null,
                    hasNext: cursorRes.hasNext,
                    limit: cursorRes.limit,
                    loadedCount: cursorRes.data.length,
                  },
                });
              }
            },
            error: (err) => {
              patchState(store, { loading: false, error: err.message });
              toast.error('Error al cargar módulos: ' + err.message);
            },
          }),
        )
        .subscribe();
    },
    loadMore(cursor: string) {
      patchState(store, { loading: true });
      api
        .getAll({ mode: 'cursor', size: LIMIT, cursor })
        .pipe(
          tap({
            next: (res) => {
              const cursorRes = res as unknown as ModulesListCursorResponse;
              const prev = store.data();
              const newData = [...prev, ...cursorRes.data];
              const loadedCount = (store.cursorPagination()?.loadedCount ?? 0) + cursorRes.data.length;
              patchState(store, {
                data: newData,
                loading: false,
                cursorPagination: {
                  nextCursor: cursorRes.nextCursor ?? null,
                  hasNext: cursorRes.hasNext,
                  limit: cursorRes.limit,
                  loadedCount,
                },
              });
            },
            error: (err) => {
              patchState(store, { loading: false });
              toast.error('Error al cargar más: ' + err.message);
            },
          }),
        )
        .subscribe();
    },
    refresh() {
      this.loadWithCursor();
    },
  })),
  withHooks({
    onInit(store) {
      store.loadWithCursor();
    },
  }),
);
