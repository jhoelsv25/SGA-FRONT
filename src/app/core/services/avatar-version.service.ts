import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AvatarVersionService {
  private readonly versionSignal = signal(0);

  readonly version = this.versionSignal.asReadonly();

  markUpdated(): number {
    const next = Date.now();
    this.versionSignal.set(next);
    return next;
  }

  withVersion(url: string | null | undefined): string | null {
    if (!url) return null;
    const version = this.versionSignal();
    if (!version) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }
}
