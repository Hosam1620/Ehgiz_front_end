import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminWallet, AdminWalletTransaction, walletTransactionTypeClass } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, LoadingSpinnerComponent],
  templateUrl: './admin-transactions.component.html',
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  /** When set, only this wallet's transactions are shown. */
  readonly walletFilter = input<AdminWallet | null>(null);
  /** Emitted when the admin clears the wallet filter to see all transactions. */
  readonly clearFilter = output<void>();

  protected readonly transactions = signal<AdminWalletTransaction[]>([]);
  protected readonly isLoading = signal(true);

  /** Transactions after applying the optional wallet filter (matched by walletId). */
  protected readonly visibleTransactions = computed(() => {
    const wallet = this.walletFilter();
    const all = this.transactions();
    return wallet ? all.filter(tx => tx.walletId === wallet.id) : all;
  });

  readonly typeClass = walletTransactionTypeClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getAllTransactions().subscribe({
      next: transactions => {
        this.transactions.set(transactions);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load transactions.', 'error');
        this.isLoading.set(false);
      },
    });
  }
}
