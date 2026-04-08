import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly canUseBrowserApis: boolean;
  private audio: HTMLAudioElement | null = null;
  private unlocked = false;
  private listeningForUnlock = false;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    this.canUseBrowserApis = isPlatformBrowser(platformId);

    if (!this.canUseBrowserApis) return;

    this.audio = new Audio('/audio/notification.mp3');
    this.audio.preload = 'auto';
    this.audio.volume = 0.8;
    this.bindUnlockListeners();
  }

  play() {
    if (!this.audio || !this.canUseBrowserApis) return;

    const playback = () => {
      if (!this.audio) return;
      this.audio.currentTime = 0;
      const result = this.audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          this.bindUnlockListeners();
        });
      }
    };

    if (!this.unlocked) {
      this.bindUnlockListeners();
    }

    playback();
  }

  private bindUnlockListeners() {
    if (!this.canUseBrowserApis || this.listeningForUnlock) return;

    const unlock = () => {
      this.unlocked = true;
      this.listeningForUnlock = false;
      this.document.removeEventListener('pointerdown', unlock, true);
      this.document.removeEventListener('keydown', unlock, true);
    };

    this.listeningForUnlock = true;
    this.document.addEventListener('pointerdown', unlock, true);
    this.document.addEventListener('keydown', unlock, true);
  }
}
