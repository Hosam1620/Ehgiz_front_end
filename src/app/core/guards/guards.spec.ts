import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';
import { guestGuard } from './guest.guard';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('route guards', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function fakeLogin(roles: string[]): void {
    // Reach into the private token signal the same way setSession does.
    (auth as unknown as { _token: { set(v: string | null): void } })._token.set('jwt');
    auth.roles.set(roles);
  }

  function run(guard: typeof authGuard): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => guard(route, state)) as boolean | UrlTree;
  }

  describe('authGuard', () => {
    it('allows logged-in users', () => {
      fakeLogin(['user']);
      expect(run(authGuard)).toBe(true);
    });

    it('redirects anonymous users to /login', () => {
      const result = run(authGuard);
      expect(result).toEqual(router.createUrlTree(['/login']));
    });
  });

  describe('adminGuard', () => {
    it('allows admins', () => {
      fakeLogin(['Admin']);
      expect(run(adminGuard)).toBe(true);
    });

    it('redirects non-admin users to /dashboard', () => {
      fakeLogin(['user']);
      expect(run(adminGuard)).toEqual(router.createUrlTree(['/dashboard']));
    });
  });

  describe('guestGuard', () => {
    it('allows anonymous users', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('redirects logged-in users to /profile', () => {
      fakeLogin(['user']);
      expect(run(guestGuard)).toEqual(router.createUrlTree(['/profile']));
    });
  });
});
