import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly cdr         = inject(ChangeDetectorRef);

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  errorMessage  = '';
  successMessage = '';
  isSubmitting  = false;
  unverifiedEmail = '';

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.unverifiedEmail = '';
    const email = this.forgotForm.getRawValue().email;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isSubmitting = false;
          if (res.succeeded) {
            this.router.navigate(['/reset-password'], { queryParams: { email } });
          } else {
            this.errorMessage = res.message || 'An error occurred. Please try again.';
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isSubmitting = false;
          try {
            // Handle ASP.NET Core ValidationProblemDetails
            if (err.error && err.error.errors && !Array.isArray(err.error.errors)) {
              this.errorMessage = err.error.title || 'Validation errors occurred.';
            } else {
              const msg: string = err.error?.message || '';

              // Unverified account
              if (err.status === 400 && msg.toLowerCase().includes('verify your email')) {
                this.errorMessage = msg;
                this.unverifiedEmail = email;
                this.cdr.detectChanges();
                return;
              }

              this.errorMessage = msg || 'An error occurred. Please try again.';
            }
          } catch (e) {
            this.errorMessage = 'An unexpected error occurred parsing the response.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }
}
