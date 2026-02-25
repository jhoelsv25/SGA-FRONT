import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ClassroomFeedItem, ChatMessage } from '../../types/classroom-types';
import { ClassroomApi } from '../classroom-api';
import { Toast } from '@core/services/toast';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

type ClassroomState = {
  feed: ClassroomFeedItem[];
  chatMessages: ChatMessage[];
  loading: boolean;
  selectedSectionId: string | null;
};

const initialState: ClassroomState = {
  feed: [],
  chatMessages: [],
  loading: false,
  selectedSectionId: null,
};

export const ClassroomStore = signalStore(
  { providedIn: 'root' },
  withState<ClassroomState>(initialState),
  withMethods((store, api = inject(ClassroomApi), toast = inject(Toast)) => ({
    loadFeed: rxMethod<string>(
      pipe(
        switchMap((id) => {
          patchState(store, { loading: true, selectedSectionId: id });
          return api.getFeed(id).pipe(
            tap({
              next: (response) => {
                patchState(store, { feed: response.data, loading: false });
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
    loadChat: rxMethod<string>(
      pipe(
        switchMap((id) => {
          return api.getChatMessages(id).pipe(
            tap({
              next: (response) => {
                patchState(store, { chatMessages: response.data });
              },
            }),
          );
        }),
      ),
    ),
    publishPost: (content: string, attachmentUrls?: string[]) => {
      const id = store.selectedSectionId();
      if (!id) return;
      return api.publishPost({
        sectionCourseId: id,
        content,
        attachmentUrl: attachmentUrls?.[0],
        attachments: attachmentUrls,
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
      return api.sendChatMessage(id, content).pipe(
        tap({
          next: (msg) => {
            const current = store.chatMessages();
            patchState(store, { chatMessages: [...current, msg] });
          }
        })
      );
    },
    uploadFile: (file: File) => {
      return api.uploadFile(file);
    },
    receiveMessage: (msg: ChatMessage) => {
      const current = store.chatMessages();
      // Avoid duplicates if needed
      patchState(store, { chatMessages: [...current, msg] });
    },
    receiveFeedUpdate: (item: ClassroomFeedItem) => {
      const current = store.feed();
      patchState(store, { feed: [item, ...current] });
    }
  })),
);
