import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

import { switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly cdr         = inject(ChangeDetectorRef);

  loginForm = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage  = '';
  isSubmitting  = false;

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.getRawValue()).pipe(
      switchMap(res => {
        if (res.succeeded) {
          return this.authService.fetchMe();
        }
        return throwError(() => ({ error: { message: res.message || 'Login failed' } }));
      })
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg: string = err.error?.message || '';

        // Unverified account — redirect silently; verify page auto-resends the code
        if (err.status === 401 && msg.toLowerCase().includes('verify your email')) {
          this.authService.pendingVerificationEmail.set(this.loginForm.value.email ?? '');
          this.authService.autoResendOnVerifyPage.set(true);
          this.router.navigate(['/verify-email']);
          return;
        }

        // Deactivated account — surface the backend message verbatim instead of
        // the generic invalid-credentials text.
        if (err.status === 401 && msg.toLowerCase().includes('deactivated')) {
          this.errorMessage = msg;
        } else if (err.status === 401) {
          this.errorMessage = msg || 'Invalid email or password.';
        } else {
          this.errorMessage = msg || 'An error occurred during login.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
