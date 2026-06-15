import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Exclude login and register from Bearer token
  const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                         req.url.includes('/api/auth/register') || 
                         req.url.includes('/api/auth/refresh');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 and the message is about invalid/expired access token
      if (error.status === 401 && error.error?.message === 'Invalid or expired access token.') {
        if (!isRefreshing) {
          isRefreshing = true;
          return authService.refresh().pipe(
            switchMap((res) => {
              isRefreshing = false;
              if (res.succeeded && res.data) {
                // Retry the original request with the new token
                const newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.data.accessToken}` }
                });
                return next(newReq);
              }
              authService.clearSession();
              return throwError(() => error);
            }),
            catchError((err) => {
              isRefreshing = false;
              authService.clearSession();
              return throwError(() => err);
            })
          );
        }
      } else if (error.status === 401 && req.url.includes('/api/auth/refresh')) {
        // If refresh fails with 401, clear session immediately
        authService.clearSession();
      }
      return throwError(() => error);
    })
  );
};
