import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, RegisterRequest, LoginResponse, UserProfile, UpdateProfileRequest } from '../models/user.model';
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

  private readonly SESSION_HINT = 'ehgiz_session_hint';
  private readonly ACCESS_TOKEN_KEY = 'ehgiz_access_token';
  private readonly ROLES_KEY = 'ehgiz_roles';
  private readonly EXPIRES_AT_KEY = 'ehgiz_expires_at';

  private readonly _token = signal<string | null>(this.readStoredToken());
  
  readonly isLoggedIn = computed(() => !!this._token());
  readonly token = computed(() => this._token());

  currentUser = signal<UserProfile | null>(null);
  roles = signal<string[]>(this.readStoredRoles());
  private authInitPromise: Promise<void> | null = null;
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

  /** Register is multipart/form-data: text fields plus optional profile/national-ID images.
   *  Don't set Content-Type here, the browser adds the multipart boundary itself. */
  register(data: RegisterRequest): Observable<ApiResponse<null>> {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('city', data.city);
    formData.append('password', data.password);
    if (data.profileImage) {
      formData.append('profileImage', data.profileImage);
    }
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/register`, formData);
  }

  verifyEmail(email: string, code: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/verify-email`, { email, code });
  }

  /** Sends a 6-digit reset code to the email if an account exists.
   *  The backend must return 200 regardless, to prevent account enumeration. */
  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/forgot-password`, { email });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/api/auth/reset-password`, { email, code, newPassword });
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

  updateMe(data: UpdateProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/auth/me`, data).pipe(
      tap(res => {
        if (res.succeeded && res.data) {
          this.currentUser.set(res.data);
        }
      })
    );
  }

  uploadProfileImage(file: File): Observable<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/auth/me/profile-image`, formData)
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.currentUser.set(res.data);
        }
      }));
  }

  deleteProfileImage(): Observable<ApiResponse<UserProfile>> {
    return this.http
      .delete<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/auth/me/profile-image`)
      .pipe(tap(res => {
        if (res.succeeded && res.data) {
          this.currentUser.set(res.data);
        }
      }));
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
    // Clear the client session first so the app is unauthenticated immediately:
    // this navigates away and unmounts authenticated pages, so no in-flight or
    // late request can 401 and surface an "Unauthorized" error toast. The
    // backend logout (which revokes the refresh token via the httpOnly cookie)
    // is then fire-and-forget and no longer needs the access token.
    this.clearSession();
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  getToken(): string | null {
    return this._token();
  }

  /** Restores the session from storage and optionally refreshes an expired token. */
  initializeAuth(): Promise<void> {
    if (!this.authInitPromise) {
      this.authInitPromise = this.runAuthInitialization();
    }
    return this.authInitPromise;
  }

  private async runAuthInitialization(): Promise<void> {
    if (!this.isLoggedIn()) {
      return;
    }

    if (this.isTokenExpired()) {
      await firstValueFrom(this.refresh().pipe(catchError(() => of(null))));
      if (!this.isLoggedIn()) {
        return;
      }
    }

    await firstValueFrom(this.fetchMe().pipe(catchError(() => of(null))));
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) {
      return false;
    }
    return new Date(expiresAt) <= new Date();
  }

  clearSession(): void {
    this._token.set(null);
    this.currentUser.set(null);
    this.roles.set([]);
    localStorage.removeItem(this.SESSION_HINT);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
    // Only redirect once the router has done its initial navigation. A failed
    // silent refresh on startup shouldn't bounce visitors off public pages;
    // protected routes are already covered by authGuard.
    if (this.router.navigated) {
      this.router.navigate(['/login']);
    }
  }

  /** Returns true if persisted auth data exists in this browser. */
  hasSessionHint(): boolean {
    return !!localStorage.getItem(this.ACCESS_TOKEN_KEY) || !!localStorage.getItem(this.SESSION_HINT);
  }

  private readStoredToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private readStoredRoles(): string[] {
    const raw = localStorage.getItem(this.ROLES_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setSession(data: LoginResponse): void {
    const roles = data.roles?.length ? data.roles : data.role ? [data.role] : [];
    this._token.set(data.accessToken);
    this.roles.set(roles);
    localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
    localStorage.setItem(this.EXPIRES_AT_KEY, data.expiresAt);
    localStorage.setItem(this.SESSION_HINT, '1');
  }
}
