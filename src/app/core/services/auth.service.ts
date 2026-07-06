import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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

  // Set on login so we know a refresh cookie probably exists. Never holds the
  // token itself, it just tells the app initializer whether a silent refresh
  // is worth attempting (visitors who never logged in skip it).
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
    if (data.nationalIdImage) {
      formData.append('nationalIdImage', data.nationalIdImage);
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

  uploadNationalId(file: File): Observable<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/auth/me/national-id`, formData)
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

  clearSession(): void {
    this._token.set(null);
    this.currentUser.set(null);
    this.roles.set([]);
    localStorage.removeItem(this.SESSION_HINT);
    // Only redirect once the router has done its initial navigation. A failed
    // silent refresh on startup shouldn't bounce visitors off public pages;
    // protected routes are already covered by authGuard.
    if (this.router.navigated) {
      this.router.navigate(['/login']);
    }
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
