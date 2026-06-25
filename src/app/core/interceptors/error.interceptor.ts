import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Do not trigger session clearing for auth endpoints (like login, which returns 401 for unverified email).
      // Use clearSession() instead of logout() to avoid infinite 401 loops from the /logout API itself.
      // Guard with isLoggedIn() so we don't double-call clearSession() when
      // authInterceptor already cleared it (e.g. after a failed token refresh).
      if (error.status === 401 && !req.url.includes('/api/auth/') && auth.isLoggedIn()) {
        auth.clearSession();
      }
      return throwError(() => error);
    }),
  );
};
