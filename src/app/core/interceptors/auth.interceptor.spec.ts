import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

const EXPIRED_BODY = { message: 'Invalid or expired access token.' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  function setToken(token: string): void {
    (auth as unknown as { _token: { set(v: string | null): void } })._token.set(token);
  }

  it('attaches a Bearer token to API requests', () => {
    setToken('jwt-1');
    http.get('/api/tools').subscribe();

    const req = controller.expectOne('/api/tools');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-1');
    req.flush({});
  });

  it('does not attach a token to auth endpoints', () => {
    setToken('jwt-1');
    http.post('/api/auth/login', {}).subscribe();

    const req = controller.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sends the request untouched when no token exists', () => {
    http.get('/api/tools').subscribe();

    const req = controller.expectOne('/api/tools');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes the token and retries the request after an expired-token 401', () => {
    setToken('stale-jwt');
    let result: unknown;
    http.get('/api/tools').subscribe(r => (result = r));

    controller.expectOne('/api/tools')
      .flush(EXPIRED_BODY, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = controller.expectOne(r => r.url.includes('/api/auth/refresh'));
    refreshReq.flush({
      succeeded: true,
      message: '',
      data: { accessToken: 'fresh-jwt', expiresAt: '', userId: 1, email: '', fullName: '', roles: ['user'] },
      errors: [],
    });

    const retried = controller.expectOne('/api/tools');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer fresh-jwt');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('clears the session when the refresh attempt fails', () => {
    setToken('stale-jwt');
    const clearSession = vi.spyOn(auth, 'clearSession').mockImplementation(() => undefined);
    let errored = false;
    http.get('/api/tools').subscribe({ error: () => (errored = true) });

    controller.expectOne('/api/tools')
      .flush(EXPIRED_BODY, { status: 401, statusText: 'Unauthorized' });

    controller.expectOne(r => r.url.includes('/api/auth/refresh'))
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBe(true);
    expect(clearSession).toHaveBeenCalled();
  });

  it('propagates ordinary 401s (wrong credentials) without refreshing', () => {
    setToken('jwt-1');
    let status = 0;
    http.get('/api/tools').subscribe({ error: e => (status = e.status) });

    controller.expectOne('/api/tools')
      .flush({ message: 'Forbidden thing' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    controller.expectNone(r => r.url.includes('/api/auth/refresh'));
  });
});
