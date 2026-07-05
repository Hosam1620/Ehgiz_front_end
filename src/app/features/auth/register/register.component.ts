import { Component, inject, ChangeDetectorRef, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ~5 MB

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

  // Optional uploads
  protected readonly profileImage = signal<File | null>(null);
  protected readonly profileImagePreview = signal<string | null>(null);
  protected readonly profileImageError = signal<string | null>(null);
  protected readonly nationalIdImage = signal<File | null>(null);
  protected readonly nationalIdPreview = signal<string | null>(null);
  protected readonly nationalIdError = signal<string | null>(null);

  onProfileImageSelected(event: Event): void {
    this.pickImage(event, this.profileImage, this.profileImagePreview, this.profileImageError);
  }

  removeProfileImage(): void {
    this.profileImage.set(null);
    this.profileImagePreview.set(null);
    this.profileImageError.set(null);
  }

  onNationalIdSelected(event: Event): void {
    this.pickImage(event, this.nationalIdImage, this.nationalIdPreview, this.nationalIdError);
  }

  removeNationalIdImage(): void {
    this.nationalIdImage.set(null);
    this.nationalIdPreview.set(null);
    this.nationalIdError.set(null);
  }

  private pickImage(
    event: Event,
    file: ReturnType<typeof signal<File | null>>,
    preview: ReturnType<typeof signal<string | null>>,
    error: ReturnType<typeof signal<string | null>>
  ): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];
    input.value = '';
    error.set(null);
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      error.set('Only image files are allowed.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      error.set('Image is too large (max 5 MB).');
      return;
    }

    file.set(selected);
    const reader = new FileReader();
    reader.onload = () => {
      preview.set(String(reader.result));
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(selected);
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.validationErrors = [];

    const { termsAccepted: _, ...fields } = this.registerForm.getRawValue();
    const payload = {
      ...fields,
      profileImage: this.profileImage(),
      nationalIdImage: this.nationalIdImage(),
    };

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
