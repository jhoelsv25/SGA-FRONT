import { inject } from '@angular/core';
import { PaginationType } from '@core/types/pagination-types';
import { User } from '@features/users/types/user-types';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { UserApi } from '../api/user-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Params } from '@angular/router';
import { pipe, switchMap, tap } from 'rxjs';

type UserState = {
  users: User[];
  pagination: PaginationType;
  total: number;
  loading: boolean;
  error: string | null;
};

export const initialUserState: UserState = {
  users: [],
  pagination: {
    page: 1,
    size: 10,
    total: 0,
  },
  total: 0,
  loading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState<UserState>(initialUserState),
  withMethods((store, api = inject(UserApi), toast = inject(Toast)) => ({
    loadAll: rxMethod<Params | void>(
      pipe(
        switchMap((params) => {
          patchState(store, { loading: true });
          return api.getAll(params || {}).pipe(
            tap({
              next: (response) => {
                patchState(store, { users: response.data, total: response.total, loading: false });
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
    create: (user: Partial<User>) => {
      patchState(store, { loading: true });
      return api.create(user).pipe(
        tap({
          next: (response) => {
            const currentUsers = store.users();
            patchState(store, { users: [response.data, ...currentUsers], loading: false });
            toast.success('User created successfully');
          },
          error: (error) => {
            patchState(store, { loading: false, error: error.message });
            toast.error(error.message);
          },
        }),
      );
    },
    update: (id: string, user: Partial<User>) => {
      patchState(store, { loading: true });
      return api.update(id, user).pipe(
        tap({
          next: (response) => {
            const updatedUsers = store
              .users()
              .map((u) => (u.id === response.data.id ? response.data : u));
            patchState(store, { users: updatedUsers, loading: false });
            toast.success('User updated successfully');
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
            const filteredUsers = store.users().filter((u) => u.id !== +id);
            patchState(store, { users: filteredUsers, loading: false });
            toast.success('User deleted successfully');
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
