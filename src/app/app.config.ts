import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { EhgizTitleStrategy } from './core/ehgiz-title.strategy';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    { provide: TitleStrategy, useClass: EhgizTitleStrategy },
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    provideAppInitializer(() => inject(AuthService).initializeAuth()),
  ],
};
