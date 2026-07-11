import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { LoginResponse, UserProfile } from '../models/user.model';

const api = environment.apiUrl;

function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    accessToken: 'jwt-token',
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    userId: 1,
    email: 'user@test.local',
    fullName: 'Test User',
    roles: ['user'],
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
  });

  it('login stores token, roles and session hint on success', () => {
    service.login({ email: 'user@test.local', password: 'pw' }).subscribe();

    const req = http.expectOne(`${api}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ succeeded: true, message: '', data: loginResponse(), errors: [] });

    expect(service.isLoggedIn()).toBe(true);
    expect(service.getToken()).toBe('jwt-token');
    expect(service.isUser()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.hasSessionHint()).toBe(true);
    expect(localStorage.getItem('ehgiz_access_token')).toBe('jwt-token');
    expect(localStorage.getItem('ehgiz_roles')).toBe(JSON.stringify(['user']));
  });

  it('restores authentication state from localStorage on reload', () => {
    localStorage.setItem('ehgiz_access_token', 'stored-token');
    localStorage.setItem('ehgiz_roles', JSON.stringify(['user']));
    localStorage.setItem('ehgiz_expires_at', new Date(Date.now() + 900_000).toISOString());

    const reloaded = TestBed.inject(AuthService);

    expect(reloaded.isLoggedIn()).toBe(true);
    expect(reloaded.getToken()).toBe('stored-token');
    expect(reloaded.isUser()).toBe(true);
  });

  it('login does not create a session when the response failed', () => {
    service.login({ email: 'user@test.local', password: 'bad' }).subscribe();

    http.expectOne(`${api}/api/auth/login`)
      .flush({ succeeded: false, message: 'Invalid', data: null, errors: [] });

    expect(service.isLoggedIn()).toBe(false);
    expect(service.hasSessionHint()).toBe(false);
    expect(localStorage.getItem('ehgiz_access_token')).toBeNull();
  });

  it('falls back to the single "role" field when roles array is missing', () => {
    service.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne(`${api}/api/auth/login`).flush({
      succeeded: true,
      message: '',
      data: loginResponse({ roles: undefined, role: 'admin' }),
      errors: [],
    });

    expect(service.isAdmin()).toBe(true);
  });

  it('register posts multipart form data with optional images', () => {
    const profileImage = new File(['x'], 'me.png', { type: 'image/png' });
    service
      .register({
        fullName: 'A',
        email: 'a@b.c',
        phoneNumber: '0100',
        city: 'Cairo',
        password: 'pw',
        profileImage,
      })
      .subscribe();

    const req = http.expectOne(`${api}/api/auth/register`);
    expect(req.request.body instanceof FormData).toBe(true);
    const form = req.request.body as FormData;
    expect(form.get('fullName')).toBe('A');
    expect(form.get('profileImage')).toBe(profileImage);
    req.flush({ succeeded: true, message: '', data: null, errors: [] });
  });

  it('fetchMe stores the current user on success', () => {
    const profile = { id: 1, email: 'a@b.c', fullName: 'A', roles: [] } as unknown as UserProfile;
    service.fetchMe().subscribe();

    http.expectOne(`${api}/api/auth/me`)
      .flush({ succeeded: true, message: '', data: profile, errors: [] });

    expect(service.currentUser()?.email).toBe('a@b.c');
  });

  it('refresh re-establishes the session from the cookie', () => {
    service.refresh().subscribe();

    const req = http.expectOne(`${api}/api/auth/refresh`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ succeeded: true, message: '', data: loginResponse(), errors: [] });

    expect(service.isLoggedIn()).toBe(true);
  });

  it('logout clears the session even when the API call fails', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    router.navigated = true; // logout always happens after the initial navigation
    // establish session first
    service.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne(`${api}/api/auth/login`)
      .flush({ succeeded: true, message: '', data: loginResponse(), errors: [] });

    service.logout();
    http.expectOne(`${api}/api/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.roles()).toEqual([]);
    expect(service.hasSessionHint()).toBe(false);
    expect(localStorage.getItem('ehgiz_access_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clearSession does not redirect before the initial navigation (startup silent-refresh failure)', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    router.navigated = false;

    service.clearSession();

    expect(service.isLoggedIn()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
