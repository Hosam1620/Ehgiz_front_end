import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  function fakeLogin(): void {
    (auth as unknown as { _token: { set(v: string | null): void } })._token.set('jwt');
  }

  it('clears the session on 401 from a non-auth endpoint while logged in', () => {
    fakeLogin();
    const clearSession = vi.spyOn(auth, 'clearSession').mockImplementation(() => undefined);

    http.get('/api/tools').subscribe({ error: () => undefined });
    controller.expectOne('/api/tools').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it('does not clear the session for auth endpoints', () => {
    fakeLogin();
    const clearSession = vi.spyOn(auth, 'clearSession');

    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    controller.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).not.toHaveBeenCalled();
  });

  it('does not clear the session when already logged out', () => {
    const clearSession = vi.spyOn(auth, 'clearSession');

    http.get('/api/tools').subscribe({ error: () => undefined });
    controller.expectOne('/api/tools').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(clearSession).not.toHaveBeenCalled();
  });

  it('passes non-401 errors through untouched', () => {
    fakeLogin();
    const clearSession = vi.spyOn(auth, 'clearSession');
    let status = 0;

    http.get('/api/tools').subscribe({ error: e => (status = e.status) });
    controller.expectOne('/api/tools').flush(null, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(clearSession).not.toHaveBeenCalled();
  });
});
