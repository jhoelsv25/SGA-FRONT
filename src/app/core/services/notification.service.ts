import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Servicio de notificaciones. Por ahora solo estado local;
 * cuando exista API de notificaciones (sin config de correo aquí) se puede conectar.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _list = signal<AppNotification[]>([]);
  list = this._list.asReadonly();

  hasUnread = signal(false);

  setFromApi(notifications: AppNotification[]): void {
    this._list.set(notifications ?? []);
    this.hasUnread.set(notifications?.some((n) => !n.read) ?? false);
  }

  markAsRead(id: string): void {
    this._list.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    this.hasUnread.set(this._list().some((n) => !n.read));
  }

  markAllAsRead(): void {
    this._list.update((list) => list.map((n) => ({ ...n, read: true })));
    this.hasUnread.set(false);
  }
}
