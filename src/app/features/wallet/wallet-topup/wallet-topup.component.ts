import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { loadStripe, StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { WalletService } from '../../../core/services/wallet.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-wallet-topup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-topup.component.html',
})
export class WalletTopupComponent implements OnDestroy {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  amount = 50;
  currency = 'usd';

  phase = signal<'form' | 'checkout'>('form');
  loading = signal(false);
  error = signal<string | null>(null);

  private checkout: StripeEmbeddedCheckout | null = null;

  proceedToPayment(): void {
    if (this.amount < 1) {
      this.error.set('Amount must be at least 1.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.walletService.initiateTopUp({ amount: this.amount, currency: this.currency }).subscribe({
      next: async (res) => {
        try {
          const stripe = await loadStripe(environment.stripePublishableKey);
          if (!stripe) {
            this.error.set('Failed to load Stripe. Please try again.');
            this.loading.set(false);
            return;
          }

          this.checkout = await stripe.createEmbeddedCheckoutPage({
            clientSecret: res.data.clientSecret,
          });

          this.phase.set('checkout');
          this.loading.set(false);

          // Wait for DOM to update, then mount
          setTimeout(() => {
            this.checkout?.mount('#checkout-container');
          }, 0);
        } catch (err) {
          this.error.set('Failed to initialize payment form.');
          this.loading.set(false);
          console.error(err);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to create checkout session. Make sure the backend is running.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/wallet']);
  }

  ngOnDestroy(): void {
    this.checkout?.destroy();
  }
}
