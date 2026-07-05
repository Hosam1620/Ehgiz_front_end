import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminListing } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';

@Component({
  selector: 'app-admin-listings',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './admin-listings.component.html',
})
export class AdminListingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly listings = signal<AdminListing[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly actingId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getListings().subscribe({
      next: list => {
        this.listings.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load listings.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  toggleAvailability(listing: AdminListing): void {
    this.actingId.set(listing.id);
    this.adminService
      .setListingAvailability(listing.id, { isAvailable: !listing.isAvailable })
      .pipe(finalize(() => this.actingId.set(null)))
      .subscribe({
        next: () => {
          this.listings.update(list =>
            list.map(l => (l.id === listing.id ? { ...l, isAvailable: !l.isAvailable } : l))
          );
          this.toast.show('Updated', `Listing marked as ${listing.isAvailable ? 'unavailable' : 'available'}.`, 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Update failed.', 'error'),
      });
  }

  async deleteListing(listing: AdminListing): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete listing',
      message: `Permanently delete "${listing.name ?? 'this listing'}"? This cannot be undone. Listings with active or pending bookings cannot be deleted.`,
      confirmLabel: 'Delete listing',
      danger: true,
    });
    if (!confirmed) return;

    const id = listing.id;
    this.actingId.set(id);
    this.adminService
      .deleteListing(id)
      .pipe(finalize(() => this.actingId.set(null)))
      .subscribe({
        next: () => {
          this.listings.update(list => list.filter(l => l.id !== id));
          this.toast.show('Deleted', 'Listing removed.', 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Delete failed.', 'error'),
      });
  }
}
