import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
// Emits null while refresh is in progress; emits the new token on success.
const refreshToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const isAuthEndpoint =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/signup') ||
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/auth/refresh') ||
    req.url.includes('/api/auth/verify-email') ||
    req.url.includes('/api/auth/resend-verification') ||
    req.url.includes('/api/auth/forgot-password') ||
    req.url.includes('/api/auth/resend-reset-code') ||
    req.url.includes('/api/auth/reset-password');

  const authReq =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isExpiredToken =
        error.status === 401 &&
        error.error?.message === 'Invalid or expired access token.' &&
        !isAuthEndpoint;

      if (!isExpiredToken) {
        if (error.status === 401 && req.url.includes('/api/auth/refresh')) {
          authService.clearSession();
        }
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — queue until the new token arrives.
        return refreshToken$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap(newToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
          )
        );
      }

      isRefreshing = true;
      refreshToken$.next(null);

      return authService.refresh().pipe(
        switchMap(res => {
          isRefreshing = false;
          if (res.succeeded && res.data) {
            refreshToken$.next(res.data.accessToken);
            return next(
              req.clone({ setHeaders: { Authorization: `Bearer ${res.data.accessToken}` } })
            );
          }
          refreshToken$.next(null);
          authService.clearSession();
          return throwError(() => error);
        }),
        catchError(err => {
          isRefreshing = false;
          refreshToken$.next(null);
          authService.clearSession();
          return throwError(() => err);
        })
      );
    })
  );
};
