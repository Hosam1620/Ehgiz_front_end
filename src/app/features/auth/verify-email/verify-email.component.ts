import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly fb        = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router    = inject(Router);
  private readonly route     = inject(ActivatedRoute);
  private readonly cdr       = inject(ChangeDetectorRef);

  verifyForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code:  ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  errorMessage   = '';
  successMessage = '';
  isSubmitting   = false;
  isResending    = false;

  // Resend countdown in seconds
  countdown      = 0;
  private _timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Priority 1 – query param (?email=...)
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email') ?? '';
    // Priority 2 – shared service state set by register/login
    const emailFromState = this.authService.pendingVerificationEmail();
    const email = emailFromQuery || emailFromState;

    if (email) {
      this.verifyForm.patchValue({ email });
    }

    // If redirected here from a failed login (unverified), auto-trigger resend immediately
    if (this.authService.autoResendOnVerifyPage()) {
      this.authService.autoResendOnVerifyPage.set(false); // reset the flag
      // Small delay so the form is rendered before showing feedback
      setTimeout(() => this.resend(), 300);
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) return;

    this.isSubmitting  = true;
    this.errorMessage  = '';
    this.successMessage = '';

    const { email, code } = this.verifyForm.getRawValue();

    this.authService.verifyEmail(email, code).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isSubmitting = false;
          if (res.succeeded) {
            // Both "verified" and "already verified" count as success
            this.authService.pendingVerificationEmail.set('');
            this.successMessage = 'Email verified! Redirecting to login…';
            this.cdr.detectChanges();
            setTimeout(() => this.router.navigate(['/login'], { queryParams: { email } }), 1500);
          } else {
            this.errorMessage = res.message || 'Verification failed.';
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Invalid or expired verification code.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  resend(): void {
    const email = this.verifyForm.getRawValue().email;
    if (!email) return;

    this.isResending    = true;
    this.errorMessage   = '';
    this.successMessage = '';

    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isResending = false;
          if (res.succeeded) {
            this.successMessage = 'A new verification code has been sent to your email.';
            this.startCountdown(15 * 60);
          } else {
            // "already verified" → redirect to login
            if (res.message?.toLowerCase().includes('already verified')) {
              this.authService.pendingVerificationEmail.set('');
              this.router.navigate(['/login'], { queryParams: { email } });
            } else {
              this.errorMessage = res.message || 'Could not send verification code.';
            }
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isResending = false;
          const msg: string = err.error?.message || 'Could not send verification code.';
          if (msg.toLowerCase().includes('already verified')) {
            this.authService.pendingVerificationEmail.set('');
            this.router.navigate(['/login'], { queryParams: { email } });
          } else {
            this.errorMessage = msg;
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  get countdownDisplay(): string {
    const m = Math.floor(this.countdown / 60).toString().padStart(2, '0');
    const s = (this.countdown % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private startCountdown(seconds: number): void {
    this.clearTimer();
    this.countdown = seconds;
    this._timer = setInterval(() => {
      this.countdown--;
      this.cdr.detectChanges();
      if (this.countdown <= 0) this.clearTimer();
    }, 1000);
  }

  private clearTimer(): void {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
}
