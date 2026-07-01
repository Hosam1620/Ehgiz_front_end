import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminWalletTransaction,
  isReversibleTransactionType,
  walletTransactionTypeClass,
} from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-transactions.component.html',
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly transactions = signal<AdminWalletTransaction[]>([]);
  protected readonly isLoading = signal(true);

  readonly typeClass = walletTransactionTypeClass;
  readonly isReversible = isReversibleTransactionType;

  // Rollback
  protected readonly rollbackTarget = signal<AdminWalletTransaction | null>(null);
  protected readonly rollbackReason = signal('');
  protected readonly isRollingBack = signal(false);

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

  openRollback(tx: AdminWalletTransaction): void {
    this.rollbackTarget.set(tx);
    this.rollbackReason.set('');
  }

  cancelRollback(): void {
    this.rollbackTarget.set(null);
    this.rollbackReason.set('');
  }

  confirmRollback(): void {
    const tx = this.rollbackTarget();
    const reason = this.rollbackReason().trim();
    if (!tx || !reason) return;

    this.isRollingBack.set(true);
    this.adminService
      .rollbackTransaction(tx.id, { reason })
      .pipe(finalize(() => this.isRollingBack.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Rolled back', `Transaction #${tx.id} was reversed.`, 'success');
          this.rollbackTarget.set(null);
          this.rollbackReason.set('');
          this.load();
        },
        error: err => this.toast.show('Rollback failed', err.error?.message ?? 'Failed to roll back transaction.', 'error'),
      });
  }
}
