import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';
import { catchError, firstValueFrom, of } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      // Only attempt a silent refresh when the user has previously authenticated
      // in this browser (session hint present). This avoids calling /auth/refresh
      // on every page load for anonymous users visiting public routes.
      if (authService.hasSessionHint()) {
        await firstValueFrom(authService.refresh().pipe(catchError(() => of(null))));
      }
      if (authService.token()) {
        await firstValueFrom(authService.fetchMe().pipe(catchError(() => of(null))));
      }
    }),
  ],
};
