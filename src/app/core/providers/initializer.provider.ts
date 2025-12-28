import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { firstValueFrom } from 'rxjs';

export function provideInitializer(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const authFacade = inject(AuthFacade);

      console.log('🚀 [AppInitializer] Starting auth initialization');

      // Retorna la promesa para bloquear el inicio de la app
      return firstValueFrom(authFacade.initialize())
        .then((success) => {
          console.log('✅ [AppInitializer] Auth initialized:', success);
          return true; // Siempre retornar true para no bloquear la app
        })
        .catch((err) => {
          console.error('❌ [AppInitializer] Auth initialization failed:', err);
          return true; // Retornar true incluso si falla, para no bloquear la app
        });
    }),
  ]);
}
