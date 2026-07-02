import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminListing } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-listings',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './admin-listings.component.html',
})
export class AdminListingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly listings = signal<AdminListing[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly actingId = signal<number | null>(null);
  protected readonly deleteConfirmId = signal<number | null>(null);

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

  confirmDelete(id: number): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  doDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.actingId.set(id);
    this.deleteConfirmId.set(null);
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
