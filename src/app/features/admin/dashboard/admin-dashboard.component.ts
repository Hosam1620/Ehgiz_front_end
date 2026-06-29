import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardStats } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly stats = signal<AdminDashboardStats | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.adminService.getDashboardStats().subscribe({
      next: data => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load dashboard stats.');
        this.isLoading.set(false);
      },
    });
  }
}
