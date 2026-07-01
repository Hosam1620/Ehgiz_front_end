import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminWalletTransaction,
  isReversibleTransactionType,
  walletTransactionTypeClass,
} from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule, LoadingSpinnerComponent, PaginationComponent],
  templateUrl: './admin-transactions.component.html',
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly transactions = signal<AdminWalletTransaction[]>([]);
  protected readonly isLoading = signal(true);

  readonly typeClass = walletTransactionTypeClass;
  readonly isReversible = isReversibleTransactionType;

  // Filters
  protected readonly transactionId = signal('');
  private readonly idInputChanges = new Subject<string>();

  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(50);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);

  // Rollback
  protected readonly rollbackTarget = signal<AdminWalletTransaction | null>(null);
  protected readonly rollbackReason = signal('');
  protected readonly isRollingBack = signal(false);

  constructor() {
    this.idInputChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.search());
  }

  ngOnInit(): void {
    this.load();
  }

  onIdInputChange(value: string): void {
    this.transactionId.set(value);
    this.idInputChanges.next(value);
  }

  load(): void {
    this.isLoading.set(true);
    const idInput = this.transactionId().trim();
    this.adminService
      .getAllTransactions({
        transactionId: idInput ? Number(idInput) : undefined,
        page: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: result => {
          this.transactions.set(result.items ?? []);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages);
          this.currentPage.set(result.pageNumber);
          this.pageSize.set(result.pageSize);
          this.isLoading.set(false);
        },
        error: err => {
          this.toast.show('Error', err.error?.message ?? 'Failed to load transactions.', 'error');
          this.isLoading.set(false);
        },
      });
  }

  search(): void {
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.transactionId.set('');
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
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
