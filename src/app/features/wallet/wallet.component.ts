import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize, of, catchError } from 'rxjs';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { WalletService } from '../../core/services/wallet.service';
import { SettingsService } from '../../core/services/settings.service';
import { Wallet, WalletTransaction } from '../../core/models/wallet.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-wallet',
  imports: [FormsModule, DatePipe, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit, OnDestroy {
  private readonly walletService = inject(WalletService);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);

  protected readonly feePercent = signal<number | null>(null);

  private embeddedCheckout: StripeEmbeddedCheckout | null = null;

  protected readonly wallet = signal<Wallet | null>(null);
  protected readonly transactions = signal<WalletTransaction[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isActing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showTopUp = signal(false);
  protected readonly showWithdraw = signal(false);
  protected readonly checkoutMounting = signal(false);

  protected topUpAmount = 100;
  protected withdrawAmount = 0;

  ngOnInit(): void {
    this.reload();
    this.settingsService.getPlatformFeePercent().subscribe({
      next: fee => this.feePercent.set(fee),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.destroyCheckout();
  }

  reload(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      wallet: this.walletService.getWallet(),
      transactions: this.walletService.getTransactions().pipe(catchError(() => of([] as WalletTransaction[]))),
    }).subscribe({
      next: ({ wallet, transactions }) => {
        this.wallet.set(wallet);
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load wallet.');
        this.isLoading.set(false);
      },
    });
  }

  openTopUpPanel(): void {
    this.showWithdraw.set(false);
    this.showTopUp.set(true);
  }

  startTopUp(): void {
    if (this.topUpAmount <= 0) {
      this.toast.show('Invalid amount', 'Enter a positive amount.', 'warning');
      return;
    }

    const publishableKey = environment.stripePublishableKey;
    if (!publishableKey) {
      this.toast.show('Stripe not configured', 'Add stripePublishableKey to environment.ts', 'warning');
      return;
    }

    this.showTopUp.set(true);
    this.destroyCheckout();
    this.isActing.set(true);
    this.checkoutMounting.set(true);

    this.walletService
      .initiateTopUp({ amount: this.topUpAmount })
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: res => void this.mountStripeCheckout(res.clientSecret),
        error: err => {
          this.checkoutMounting.set(false);
          this.toast.show('Top-up failed', err.error?.message ?? 'Could not start checkout.', 'error');
        },
      });
  }

  private async mountStripeCheckout(clientSecret: string): Promise<void> {
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(environment.stripePublishableKey);
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      this.destroyCheckout();
      this.embeddedCheckout = await stripe.createEmbeddedCheckoutPage({
        clientSecret,
      });

      const el = document.getElementById('stripe-checkout');
      if (!el) {
        throw new Error('Checkout container not found');
      }

      el.innerHTML = '';
      this.embeddedCheckout!.mount(el);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.toast.show('Stripe error', `Failed to load payment form: ${message}`, 'error');
    } finally {
      this.checkoutMounting.set(false);
    }
  }

  private destroyCheckout(): void {
    if (this.embeddedCheckout) {
      this.embeddedCheckout.destroy();
      this.embeddedCheckout = null;
    }
    const el = document.getElementById('stripe-checkout');
    if (el) el.innerHTML = '';
  }

  submitWithdraw(): void {
    if (this.withdrawAmount <= 0) {
      this.toast.show('Invalid amount', 'Enter a positive amount.', 'warning');
      return;
    }

    this.isActing.set(true);
    this.walletService
      .withdraw({ amount: this.withdrawAmount })
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Withdrawal initiated', 'Funds will arrive in your bank account.', 'success');
          this.showWithdraw.set(false);
          this.reload();
        },
        error: err => this.toast.show('Withdrawal failed', err.error?.message ?? 'Could not withdraw.', 'error'),
      });
  }

  connectBank(): void {
    this.isActing.set(true);
    this.walletService
      .getConnectOnboardingUrl()
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: res => (window.location.href = res.onboardingUrl),
        error: err => this.toast.show('Connect failed', err.error?.message ?? 'Could not start bank setup.', 'error'),
      });
  }

  transactionSign(amount: number): string {
    return amount >= 0 ? '+' : '';
  }

  transactionClass(amount: number): string {
    return amount >= 0 ? 'color:var(--green);' : 'color:var(--red);';
  }
}
