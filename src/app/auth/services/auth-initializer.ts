import { Injectable, inject, signal } from '@angular/core';
import { AuthFacade } from './store/auth.acede';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthInitializer {
  private authFacade = inject(AuthFacade);
  private initializationPromise: Promise<boolean> | null = null;
  private isInitialized = signal(false);

  /**
   * Inicializa la autenticación una sola vez
   * Retorna una Promise que se puede await en guards
   */
  initialize(): Promise<boolean> {
    // Si ya se inicializó, retornar inmediatamente
    if (this.isInitialized()) {
      return Promise.resolve(this.authFacade.isAuthenticated());
    }

    // Si ya hay una inicialización en progreso, retornar la misma Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Crear nueva Promise de inicialización
    this.initializationPromise = firstValueFrom(this.authFacade.initialize())
      .then((result) => {
        this.isInitialized.set(true);
        console.log('✅ [AuthInitializer] Inicialización completada:', result);
        return result;
      })
      .catch((error) => {
        this.isInitialized.set(true);
        console.error('❌ [AuthInitializer] Error en inicialización:', error);
        return false;
      });

    return this.initializationPromise;
  }

  /**
   * Verifica si ya se completó la inicialización
   */
  isReady(): boolean {
    return this.isInitialized();
  }
}
