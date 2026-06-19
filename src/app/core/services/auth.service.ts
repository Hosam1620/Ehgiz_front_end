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

  private readonly TOKEN_KEY = 'ehgiz_access_token';
  private readonly EXPIRES_KEY = 'ehgiz_expires_at';

  private readonly _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  
  readonly isLoggedIn = computed(() => !!this._token());
  readonly token = computed(() => this._token());

  currentUser = signal<UserProfile | null>(null);
  roles = signal<string[]>([]);
  isAdmin = computed(() => this.roles().includes('admin'));
  isUser = computed(() => this.roles().includes('user'));

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/login`, credentials, { withCredentials: true })
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.setSession(res.data.accessToken, res.data.expiresAt);
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
      tap({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.currentUser.set(res.data);
            this.roles.set(res.data.roles || []);
          }
        },
        error: () => this.clearSession()
      })
    );
  }

  refresh(): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.setSession(res.data.accessToken, res.data.expiresAt);
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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this._token.set(null);
    this.currentUser.set(null);
    this.roles.set([]);
    this.router.navigate(['/login']);
  }

  private setSession(token: string, expiresAt: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.EXPIRES_KEY, expiresAt);
    this._token.set(token);
  }
}
