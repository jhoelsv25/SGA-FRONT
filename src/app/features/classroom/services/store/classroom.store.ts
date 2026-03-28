import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ClassroomFeedItem, ChatMessage } from '../../types/classroom-types';
import { ClassroomApi } from '../classroom-api';
import { ClassroomSocketService } from '../classroom-socket';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { map, pipe, switchMap, tap } from 'rxjs';

type ClassroomState = {
  feed: ClassroomFeedItem[];
  feedSearch: string;
  feedNextCursor: { date: string; id: string } | null;
  feedHasNext: boolean;
  feedLoadingMore: boolean;
  chatMessages: ChatMessage[];
  chatNextCursor: { date: string; id: string } | null;
  chatHasNext: boolean;
  chatLoadingMore: boolean;
  loading: boolean;
  selectedSectionId: string | null;
};

const initialState: ClassroomState = {
  feed: [],
  feedSearch: '',
  feedNextCursor: null,
  feedHasNext: false,
  feedLoadingMore: false,
  chatMessages: [],
  chatNextCursor: null,
  chatHasNext: false,
  chatLoadingMore: false,
  loading: false,
  selectedSectionId: null,
};

export const ClassroomStore = signalStore(
  { providedIn: 'root' },
  withState<ClassroomState>(initialState),
  withMethods((store, api = inject(ClassroomApi), socket = inject(ClassroomSocketService), toast = inject(Toast)) => ({
    loadFeed: rxMethod<string | { id: string; search?: string }>(
      pipe(
        switchMap((payload) => {
          const id = typeof payload === 'string' ? payload : payload.id;
          const search = typeof payload === 'string' ? '' : payload.search?.trim() ?? '';
          patchState(store, {
            loading: true,
            selectedSectionId: id,
            feedSearch: search,
            feedNextCursor: null,
            feedHasNext: false,
            feedLoadingMore: false,
          });
          return api.getFeed(id, { limit: 15, search }).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  feed: response.data,
                  feedNextCursor: response.nextCursor,
                  feedHasNext: response.hasNext,
                  loading: false,
                });
              },
              error: (error) => {
                patchState(store, { loading: false });
                toast.error('Error al cargar feed: ' + error.message);
              },
            }),
          );
        }),
      ),
    ),
    loadOlderFeed: () => {
      const id = store.selectedSectionId();
      const cursor = store.feedNextCursor();
      if (!id || !cursor || store.feedLoadingMore()) return null;

      patchState(store, { feedLoadingMore: true });
      return api
        .getFeed(id, {
          cursorDate: cursor.date,
          cursorId: cursor.id,
          limit: 15,
          search: store.feedSearch(),
        })
        .pipe(
          tap({
            next: (response) => {
              const existingIds = new Set(store.feed().map((item) => item.id));
              patchState(store, {
                feed: [
                  ...store.feed(),
                  ...(response.data ?? []).filter((item) => !existingIds.has(item.id)),
                ],
                feedNextCursor: response.nextCursor,
                feedHasNext: response.hasNext,
                feedLoadingMore: false,
              });
            },
            error: () => {
              patchState(store, { feedLoadingMore: false });
              toast.error('No se pudo cargar mas publicaciones');
            },
          }),
          map((response) => response.data?.length ?? 0),
        );
    },
    loadChat: rxMethod<string>(
      pipe(
        switchMap((id) => {
          patchState(store, { selectedSectionId: id, chatLoadingMore: true });
          return api.getChatMessages(id, { limit: 30 }).pipe(
            tap({
              next: (response) => {
                patchState(store, {
                  chatMessages: response.data ?? [],
                  chatNextCursor: response.nextCursor,
                  chatHasNext: response.hasNext,
                  chatLoadingMore: false,
                });
              },
              error: () => patchState(store, { chatLoadingMore: false }),
            }),
          );
        }),
      ),
    ),
    loadOlderMessages: () => {
      const id = store.selectedSectionId();
      const cursor = store.chatNextCursor();
      if (!id || !cursor || store.chatLoadingMore()) return null;

      patchState(store, { chatLoadingMore: true });
      return api
        .getChatMessages(id, {
          cursorDate: cursor.date,
          cursorId: cursor.id,
          limit: 30,
        })
        .pipe(
          tap({
            next: (response) => {
              patchState(store, {
                chatMessages: [...(response.data ?? []), ...store.chatMessages()],
                chatNextCursor: response.nextCursor,
                chatHasNext: response.hasNext,
                chatLoadingMore: false,
              });
            },
            error: () => {
              patchState(store, { chatLoadingMore: false });
              toast.error('No se pudo cargar mas historial');
            },
          }),
          map((response) => response.data?.length ?? 0),
        );
    },
    publishPost: (content: string, attachments?: { url: string; name: string }[]) => {
      const id = store.selectedSectionId();
      if (!id) return;
      return socket.publishPost(id, {
        content,
        attachments: attachments?.length ? attachments : undefined,
      }).pipe(
        tap({
          next: () => toast.success('Publicado correctamente'),
          error: (err) => toast.error('Error al publicar: ' + (err?.message ?? '')),
        })
      );
    },
    sendMessage: (content: string) => {
      const id = store.selectedSectionId();
      if (!id) return;
      return socket.sendMessage(id, content).pipe(
        tap({
          next: () => void 0,
        })
      );
    },
    uploadFile: (file: File, options?: { category?: string; entityCode?: string; preserveName?: boolean }) => {
      return api.uploadFile(file, options);
    },
    receiveMessage: (msg: ChatMessage) => {
      const current = store.chatMessages();
      if (current.some((item) => item.id === msg.id)) return;
      patchState(store, { chatMessages: [...current, msg] });
    },
    receiveFeedUpdate: (item: ClassroomFeedItem) => {
      const current = store.feed();
      const existingIndex = current.findIndex((feedItem) => feedItem.id === item.id);

      if (existingIndex >= 0) {
        patchState(store, {
          feed: current.map((feedItem) => (feedItem.id === item.id ? item : feedItem)),
        });
        return;
      }

      patchState(store, { feed: [item, ...current] });
    },
    replaceFeedItem: (item: ClassroomFeedItem) => {
      patchState(store, {
        feed: store.feed().map((current) => (current.id === item.id ? item : current)),
      });
    },
    removeFeedItem: (id: string) => {
      patchState(store, {
        feed: store.feed().filter((item) => item.id !== id),
      });
    },
  })),
);
