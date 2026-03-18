import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { NotificationApi, Notification } from '../services/api/notification-api';
import { Toast } from '@core/services/toast';
import { AuthStore } from '@/auth/services/store/auth.store';

type NotificationState = {
  data: Notification[];
  nextCursor: { date: string; id: string } | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
};

const initialState: NotificationState = {
  data: [],
  nextCursor: null,
  unreadCount: 0,
  loading: false,
  error: null,
};

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationState>(initialState),
  withMethods(
    (store, api = inject(NotificationApi), auth = inject(AuthStore), toast = inject(Toast)) => ({
      loadInitial(params: Record<string, unknown> = {}) {
        const user = auth.currentUser();
        if (!user) return;
        patchState(store, { loading: true, error: null });
        api.findAllCursor({ ...params, recipientId: user.id, limit: 10 }).subscribe({
          next: (res) => {
            patchState(store, {
              data: res.data ?? [],
              nextCursor: res.nextCursor,
              unreadCount: res.unreadCount ?? 0,
              loading: false,
            });
          },
          error: (err) => {
            patchState(store, { loading: false, error: err.message });
            toast.error('Error al cargar notificaciones');
          },
        });
      },

      loadMore(params: Record<string, unknown> = {}) {
        const cursor = store.nextCursor();
        if (!cursor || store.loading()) return;

        patchState(store, { loading: true });
        api
          .findAllCursor({
            ...params,
            recipientId: auth.currentUser()?.id,
            cursorDate: cursor.date,
            cursorId: cursor.id,
            limit: 10,
          })
          .subscribe({
            next: (res) => {
              patchState(store, {
                data: [...store.data(), ...(res.data ?? [])],
                nextCursor: res.nextCursor,
                unreadCount: res.unreadCount ?? 0,
                loading: false,
              });
            },
            error: (err) => {
              patchState(store, { loading: false, error: err.message });
              toast.error('Error al cargar más notificaciones');
            },
          });
      },

      markAsRead(id: string) {
        api.markAsRead(id).subscribe({
          next: () => {
            patchState(store, {
              data: store.data().map((n) => (n.id === id ? { ...n, isRead: true } : n)),
              unreadCount: Math.max(0, store.unreadCount() - 1),
            });
          },
          error: (err) => {
            toast.error('No se pudo marcar como leída');
          },
        });
      },
    }),
  ),
  withHooks({
    onInit(store) {
      store.loadInitial();
    },
  }),
);
