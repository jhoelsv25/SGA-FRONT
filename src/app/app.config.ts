import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiInterceptor } from '@core/interceptors/api.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { authInterceptor } from '@auth/interceptors/auth.interceptor';
import { provideZard } from '@/shared/core/provider/providezard';

registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor, apiInterceptor, errorInterceptor]),
      withFetch(),
    ),
    provideZard(),
    { provide: LOCALE_ID, useValue: 'es-PE' },
  ],
};
