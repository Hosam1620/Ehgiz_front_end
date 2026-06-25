import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, skip, switchMap, take, throwError } from 'rxjs';
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
    req.url.includes('/api/auth/resend-verification');

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
        // Another request is already refreshing — queue until the refresh settles.
        // skip(1) bypasses the BehaviorSubject's replayed current value (null) so
        // we only react to the next emission: a new token on success, or null on
        // failure — in which case we reject this queued request immediately.
        return refreshToken$.pipe(
          skip(1),
          take(1),
          switchMap(newToken =>
            newToken
              ? next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
              : throwError(() => error)
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
