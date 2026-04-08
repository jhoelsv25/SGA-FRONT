import { effect, inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { NotificationApi, Notification } from '../services/api/notification-api';
import { Toast } from '@core/services/toast';
import { AuthStore } from '@/auth/services/store/auth.store';
import { NotificationSocketService } from '../services/notification-socket.service';
import { NotificationSoundService } from '../services/notification-sound.service';

type NotificationState = {
  data: Notification[];
  liveCards: Notification[];
  liveOverflowCount: number;
  nextCursor: { date: string; id: string } | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  initializedForUserId: string | null;
};

const LIVE_CARD_TIMEOUT_MS = 7000;

const initialState: NotificationState = {
  data: [],
  liveCards: [],
  liveOverflowCount: 0,
  nextCursor: null,
  unreadCount: 0,
  loading: false,
  error: null,
  initializedForUserId: null,
};

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationState>(initialState),
  withMethods(
    (
      store,
      api = inject(NotificationApi),
      auth = inject(AuthStore),
      toast = inject(Toast),
      socket = inject(NotificationSocketService),
      sound = inject(NotificationSoundService),
    ) => ({
      scheduleLiveCardDismiss(id: string) {
        if (typeof window === 'undefined') return;

        window.setTimeout(() => {
          patchState(store, {
            liveCards: store.liveCards().filter(item => item.id !== id || (item as Notification & { _paused?: boolean })._paused),
          });
        }, LIVE_CARD_TIMEOUT_MS);
      },

      loadInitial(params: Record<string, unknown> = {}) {
        const user = auth.currentUser();
        if (!user) return;
        patchState(store, { loading: true, error: null });
        api.findAllCursor({ ...params, limit: 10 }).subscribe({
          next: (res) => {
            patchState(store, {
              data: res.data ?? [],
              nextCursor: res.nextCursor,
              unreadCount: res.unreadCount ?? 0,
              loading: false,
              initializedForUserId: user.id,
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

      markAllAsRead() {
        api.markAllAsRead().subscribe({
          next: () => {
            patchState(store, {
              data: store.data().map(notification => ({ ...notification, isRead: true })),
              liveCards: store.liveCards().map(notification => ({ ...notification, isRead: true })),
              unreadCount: 0,
            });
          },
          error: () => {
            toast.error('No se pudo marcar todo como leído');
          },
        });
      },

      dismissLiveCard(id: string) {
        patchState(store, {
          liveCards: store.liveCards().filter(notification => notification.id !== id),
        });
      },

      clearLiveOverflow() {
        patchState(store, { liveOverflowCount: 0 });
      },

      pauseLiveCard(id: string) {
        patchState(store, {
          liveCards: store.liveCards().map(notification =>
            notification.id === id
              ? ({ ...notification, _paused: true } as Notification)
              : notification,
          ),
        });
      },

      resumeLiveCard(id: string) {
        let resumed = false;
        patchState(store, {
          liveCards: store.liveCards().map(notification => {
            if (notification.id !== id) return notification;
            resumed = true;
            return ({ ...notification, _paused: false } as Notification);
          }),
        });

        if (resumed) {
          this.scheduleLiveCardDismiss(id);
        }
      },

      openLiveCard(notification: Notification) {
        api.markAsRead(notification.id).subscribe({
          next: () => {
            patchState(store, {
              data: store.data().map((item) =>
                item.id === notification.id ? { ...item, isRead: true } : item,
              ),
              liveCards: store.liveCards().filter(item => item.id !== notification.id),
              unreadCount: Math.max(0, store.unreadCount() - (notification.isRead ? 0 : 1)),
            });
          },
          error: () => {
            toast.error('No se pudo abrir la notificación');
          },
        });
      },

      connectRealtime() {
        socket.connect();
        socket.notification$.subscribe(notification => {
          const exists = store.data().some(item => item.id === notification.id);
          if (exists) return;

          sound.play();
          const nextLiveCards = [notification, ...store.liveCards()];
          patchState(store, {
            data: [notification, ...store.data()],
            liveCards: nextLiveCards.slice(0, 3),
            liveOverflowCount: Math.max(0, nextLiveCards.length - 3),
            unreadCount: store.unreadCount() + (notification.isRead ? 0 : 1),
          });
          this.scheduleLiveCardDismiss(notification.id);
        });
      },
    }),
  ),
  withHooks({
    onInit(store, auth = inject(AuthStore)) {
      effect(() => {
        const user = auth.currentUser();

        if (!user) {
          patchState(store, {
            data: [],
            liveCards: [],
            liveOverflowCount: 0,
            nextCursor: null,
            unreadCount: 0,
            loading: false,
            error: null,
            initializedForUserId: null,
          });
          return;
        }

        if (store.initializedForUserId() !== user.id) {
          store.loadInitial();
        }

        store.connectRealtime();
      });
    },
  }),
);
