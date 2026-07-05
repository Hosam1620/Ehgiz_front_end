import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

type Step = 'request' | 'reset';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly step = signal<Step>('request');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly countdown = signal(0);
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Same password policy as registration.
  protected readonly resetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
    newPassword: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[^a-zA-Z0-9]).{8,}$')]],
  });

  onRequestCode(): void {
    if (this.requestForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.requestForm.getRawValue().email).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.step.set('reset');
        this.startCountdown();
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { code, newPassword } = this.resetForm.getRawValue();
    this.auth.resetPassword(this.requestForm.getRawValue().email, code, newPassword).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        if (res.succeeded) {
          this.toast.show('Password updated', 'You can now sign in with your new password.', 'success');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage.set(res.message || 'Invalid or expired code.');
        }
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Invalid or expired code. Please try again.');
      },
    });
  }

  resendCode(): void {
    if (this.countdown() > 0 || this.isSubmitting()) return;
    this.auth.forgotPassword(this.requestForm.getRawValue().email).subscribe({
      next: () => this.startCountdown(),
      error: () => this.startCountdown(), // Same behavior either way so we don't leak which emails exist.
    });
  }

  backToRequest(): void {
    this.step.set('request');
    this.errorMessage.set(null);
    this.resetForm.reset();
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.countdown.set(RESEND_COOLDOWN_SECONDS);
    this.countdownTimer = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) this.stopCountdown();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
