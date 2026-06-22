import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-wallet-topup-return',
  imports: [RouterModule],
  template: `
    <div class="card-elevated" style="max-width:480px;margin:48px auto;padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h2 style="font-size:20px;margin-bottom:8px;">Top-up processing</h2>
      <p style="font-size:14px;color:var(--text-2);margin-bottom:24px;">
        If payment succeeded, your wallet balance will update shortly.
      </p>
      <a class="btn btn-primary" routerLink="/wallet">Back to wallet</a>
    </div>
  `,
})
export class WalletTopupReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const sessionId = params.get('session_id');
      if (sessionId) {
        console.info('Stripe checkout session:', sessionId);
      }
    });
  }
}
