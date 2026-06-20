import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  // If user is logged in but not admin, send to dashboard.
  // If not logged in, authGuard (which should be paired with this) would normally catch them,
  // but just in case, dashboard will bounce them to login anyway.
  return router.createUrlTree(['/dashboard']);
};
