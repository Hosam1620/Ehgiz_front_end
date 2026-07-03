import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, RegisterRequest, LoginResponse, UserProfile } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Lightweight flag: exists when a valid refresh cookie is likely present.
  // Never stores the actual token — only used to decide whether to attempt
  // a silent refresh on startup so we don't call /auth/refresh on public pages
  // for users who have never logged in.
  private readonly SESSION_HINT = 'ehgiz_session_hint';

  private readonly _token = signal<string | null>(null);
  
  readonly isLoggedIn = computed(() => !!this._token());
  readonly token = computed(() => this._token());

  currentUser = signal<UserProfile | null>(null);
  roles = signal<string[]>([]);
  isAdmin = computed(() => this.roles().some(r => r.toLowerCase() === 'admin'));
  isUser = computed(() => this.roles().some(r => r.toLowerCase() === 'user'));

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/login`, credentials, { withCredentials: true })
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.setSession(res.data);
        }
      }));
  }

  /** Shared state: email waiting for OTP verification. Set on register, read on verify page. */
  pendingVerificationEmail = signal<string>('');

  /** When true the verify-email page will auto-trigger resend on init (set by login 401). */
  autoResendOnVerifyPage = signal<boolean>(false);

  register(data: RegisterRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/register`, data);
  }

  verifyEmail(email: string, code: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/verify-email`, { email, code });
  }

  resendVerification(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/resend-verification`, { email });
  }

  fetchMe(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/auth/me`).pipe(
      tap(res => {
        if (res.succeeded && res.data) {
          this.currentUser.set(res.data);
          // Roles are set from login/refresh response; /auth/me does not return them
        }
      })
    );
  }

  refresh(): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.setSession(res.data);
        }
      }));
  }

  logout(): void {
    // Attempt backend logout, but clean up client regardless
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  clearSession(): void {
    this._token.set(null);
    this.currentUser.set(null);
    this.roles.set([]);
    localStorage.removeItem(this.SESSION_HINT);
    this.router.navigate(['/login']);
  }

  /** Returns true if the user previously authenticated in this browser, so the
   *  app initializer knows to attempt a silent refresh via the httpOnly cookie. */
  hasSessionHint(): boolean {
    return !!localStorage.getItem(this.SESSION_HINT);
  }

  private setSession(data: LoginResponse): void {
    this._token.set(data.accessToken);
    this.roles.set(data.roles?.length ? data.roles : data.role ? [data.role] : []);
    localStorage.setItem(this.SESSION_HINT, '1');
  }
}
