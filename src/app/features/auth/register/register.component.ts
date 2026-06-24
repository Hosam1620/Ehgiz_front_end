import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);

  registerForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
    city: ['', Validators.required],
    password: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[^a-zA-Z0-9]).{8,}$')]],
    termsAccepted: [false, Validators.requiredTrue],
  });

  errorMessage = '';
  validationErrors: string[] = [];
  isSubmitting = false;

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.validationErrors = [];

    const { termsAccepted: _, ...payload } = this.registerForm.getRawValue();
    this.authService.register(payload).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isSubmitting = false;
          if (res.succeeded) {
            // Save email to shared service state for the verify page
            this.authService.pendingVerificationEmail.set(this.registerForm.value.email ?? '');
            this.router.navigate(['/verify-email']);
          } else {
            this.errorMessage = res.message || 'Registration failed';
            this.validationErrors = res.errors || [];
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isSubmitting = false;
          
          try {
            // Handle ASP.NET Core default ValidationProblemDetails
            if (err.error && err.error.errors && !Array.isArray(err.error.errors)) {
              this.errorMessage = err.error.title || 'Validation errors occurred.';
              this.validationErrors = Object.values(err.error.errors).flat() as string[];
            } else {
              // Handle custom ApiResponse
              this.errorMessage = err.error?.message || err.message || 'An error occurred during registration.';
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
}
