import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly cdr         = inject(ChangeDetectorRef);

  resetForm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
    newPassword: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z]).{7,}$')]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  errorMessage = '';
  validationErrors: string[] = [];
  successMessage = '';
  isSubmitting = false;
  isResending = false;

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.resetForm.patchValue({ email });
    }
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.validationErrors = [];
    this.successMessage = '';

    const { code, newPassword } = this.resetForm.getRawValue();
    const email = this.resetForm.getRawValue().email;

    this.authService.resetPassword(email, code, newPassword).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isSubmitting = false;
          if (res.succeeded) {
            this.router.navigate(['/login']);
          } else {
            this.errorMessage = res.message || 'Password reset failed.';
            this.validationErrors = res.errors || [];
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isSubmitting = false;
          try {
            if (err.error && err.error.errors && !Array.isArray(err.error.errors)) {
              this.errorMessage = err.error.title || 'Validation errors occurred.';
              this.validationErrors = Object.values(err.error.errors).flat() as string[];
            } else {
              this.errorMessage = err.error?.message || 'An error occurred during password reset.';
              this.validationErrors = err.error?.errors || [];
            }
          } catch (e) {
            this.errorMessage = 'An unexpected error occurred parsing the response.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  resendCode() {
    const email = this.resetForm.getRawValue().email;
    if (!email) return;

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];

    this.authService.resendResetCode(email).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isResending = false;
          this.successMessage = res.message || 'Reset code sent.';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isResending = false;
          this.errorMessage = err.error?.message || 'Failed to resend code.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
