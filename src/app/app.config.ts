import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptorFn } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // ← provideClientHydration REMOVIDO: causaba que Angular pre-renderizara
    //   en el servidor Node.js donde isPlatformBrowser() = false,
    //   haciendo que el interceptor omitiera el token Authorization
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptorFn])
    ),
  ]
};