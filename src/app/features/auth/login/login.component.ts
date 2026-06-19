import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.succeeded) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'Login failed';
          this.cdr.detectChanges();
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

        this.errorMessage = msg || 'An error occurred during login.';
        this.cdr.detectChanges();
      }
    });
  }
}
