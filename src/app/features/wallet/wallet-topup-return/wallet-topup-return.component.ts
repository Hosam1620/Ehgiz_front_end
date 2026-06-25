import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-wallet-topup-return',
  imports: [RouterLink],
  template: `
    <div class="card-elevated" style="max-width:480px;margin:48px auto;padding:32px;text-align:center;">
      @if (status() === 'success') {
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h2 style="font-size:20px;margin-bottom:8px;">Top-up processing</h2>
        <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;">
          Your wallet balance will update shortly.
        </p>
      } @else if (status() === 'processing') {
        <div style="font-size:48px;margin-bottom:16px;">⏳</div>
        <h2 style="font-size:20px;margin-bottom:8px;">Payment pending</h2>
        <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;">
          Your payment is being processed. Your balance will update once confirmed.
        </p>
      } @else if (status() === 'failed') {
        <div style="font-size:48px;margin-bottom:16px;">❌</div>
        <h2 style="font-size:20px;margin-bottom:8px;">Payment failed</h2>
        <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;">
          Your payment was not processed. Please try again with a different method.
        </p>
      } @else {
        <div style="font-size:48px;margin-bottom:16px;">↩️</div>
        <h2 style="font-size:20px;margin-bottom:8px;">Payment cancelled</h2>
        <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;">
          You cancelled the top-up. No funds were charged.
        </p>
      }
      <a class="btn btn-primary" routerLink="/wallet">Back to wallet</a>
    </div>
  `,
})
export class WalletTopupReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly status = signal<'success' | 'processing' | 'failed' | 'cancelled'>('cancelled');

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const redirectStatus = params.get('redirect_status');
      const sessionId = params.get('session_id');

      if (redirectStatus === 'succeeded' || (!redirectStatus && sessionId)) {
        this.status.set('success');
      } else if (redirectStatus === 'processing') {
        // Async payment methods (e.g. bank transfer) — payment is pending
        this.status.set('processing');
      } else if (redirectStatus === 'requires_payment_method') {
        // Payment intent failed — user needs to retry with a different method
        this.status.set('failed');
      } else if (redirectStatus === 'canceled' || redirectStatus === 'cancelled') {
        this.status.set('cancelled');
      }
    });
  }
}
