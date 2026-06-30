import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminWallet } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-wallets',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './admin-wallets.component.html',
})
export class AdminWalletsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly wallets = signal<AdminWallet[]>([]);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getWallets().subscribe({
      next: list => {
        this.wallets.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load wallets.', 'error');
        this.isLoading.set(false);
      },
    });
  }
}
