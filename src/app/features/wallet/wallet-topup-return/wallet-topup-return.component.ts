import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { Wallet } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet-topup-return',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-topup-return.component.html',
})
export class WalletTopupReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly walletService = inject(WalletService);

  sessionId = signal<string | null>(null);
  wallet = signal<Wallet | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.sessionId.set(this.route.snapshot.queryParamMap.get('session_id'));
    this.refreshWallet();
  }

  private refreshWallet(): void {
    this.walletService.getWallet().subscribe({
      next: (res) => {
        this.wallet.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/wallet']);
  }
}
