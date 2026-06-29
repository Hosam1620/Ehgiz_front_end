import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminPayment, paymentStatusChipClass } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, LoadingSpinnerComponent],
  templateUrl: './admin-payments.component.html',
})
export class AdminPaymentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly payments = signal<AdminPayment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly selected = signal<AdminPayment | null>(null);
  protected readonly isLoadingDetail = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getAdminPayments().subscribe({
      next: list => {
        this.payments.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load payments.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  view(id: number): void {
    this.isLoadingDetail.set(true);
    this.selected.set(null);
    this.adminService.getAdminPaymentById(id).subscribe({
      next: p => {
        this.selected.set(p);
        this.isLoadingDetail.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load payment.', 'error');
        this.isLoadingDetail.set(false);
      },
    });
  }

  close(): void {
    this.selected.set(null);
  }

  readonly statusClass = paymentStatusChipClass;
}
