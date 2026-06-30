import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminWalletTransaction, walletTransactionTypeClass } from '../../../core/models/admin.model';
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

  protected readonly transactions = signal<AdminWalletTransaction[]>([]);
  protected readonly isLoading = signal(true);

  readonly typeClass = walletTransactionTypeClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getAllTransactions().subscribe({
      next: list => {
        this.transactions.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load transactions.', 'error');
        this.isLoading.set(false);
      },
    });
  }
}
