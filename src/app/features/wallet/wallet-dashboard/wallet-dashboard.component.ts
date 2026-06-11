import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { Wallet, WalletTransaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-dashboard.component.html',
})
export class WalletDashboardComponent implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  wallet = signal<Wallet | null>(null);
  transactions = signal<WalletTransaction[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.walletService.getWallet().subscribe({
      next: (res) => {
        this.wallet.set(res.data);
        this.loadTransactions();
      },
      error: (err) => {
        this.error.set('Failed to load wallet. Make sure the backend is running.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  private loadTransactions(): void {
    this.walletService.getTransactions().subscribe({
      next: (res) => {
        this.transactions.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.transactions.set([]);
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  goToTopUp(): void {
    this.router.navigate(['/wallet/topup']);
  }
}
