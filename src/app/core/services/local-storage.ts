import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  private _storage: Storage = localStorage;

  get<T>(key: string): T | null {
    const value = this._storage.getItem(key);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch {
      return value as unknown as T;
    }
  }

  set(key: string, value: string): void {
    this._storage.setItem(key, value);
  }

  remove(key: string): void {
    this._storage.removeItem(key);
  }
}
