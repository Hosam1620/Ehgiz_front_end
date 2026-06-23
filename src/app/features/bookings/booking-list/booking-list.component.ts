import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { BookingCard, BookingStatus } from '../../../core/models/booking.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type BookingTab = 'my' | 'received';

@Component({
  standalone: true,
  selector: 'app-booking-list',
  imports: [RouterModule, DecimalPipe, DatePipe, NgClass, LoadingSpinnerComponent],
  templateUrl: './booking-list.component.html',
})
export class BookingListComponent implements OnInit {
  private readonly bookingService = inject(BookingService);

  protected readonly activeTab = signal<BookingTab>('my');
  protected readonly myBookings = signal<BookingCard[]>([]);
  protected readonly receivedBookings = signal<BookingCard[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly displayedBookings = computed(() =>
    this.activeTab() === 'my' ? this.myBookings() : this.receivedBookings()
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  setTab(tab: BookingTab): void {
    this.activeTab.set(tab);
  }

  reload(): void {
    this.loadBookings();
  }

  statusClass(status: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      Pending: 'chip-amber',
      Accepted: 'chip-blue',
      DeliveryHandover: 'chip-blue',
      Active: 'chip-green',
      ReturnHandover: 'chip-blue',
      Completed: 'chip-gray',
      Rejected: 'chip-red',
      Cancelled: 'chip-gray',
      Disputed: 'chip-red',
    };
    return map[status] ?? 'chip-gray';
  }

  statusLabel(status: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      Pending: 'Pending approval',
      Accepted: 'Accepted',
      DeliveryHandover: 'Delivery handover',
      Active: 'Active rental',
      ReturnHandover: 'Return handover',
      Completed: 'Completed',
      Rejected: 'Rejected',
      Cancelled: 'Cancelled',
      Disputed: 'Disputed',
    };
    return map[status] ?? status;
  }

  otherPartyLabel(): string {
    return this.activeTab() === 'my' ? 'Owner' : 'Renter';
  }

  private loadBookings(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.bookingService.getMyBookings().subscribe({
      next: bookings => this.myBookings.set(bookings),
      error: err => this.error.set(err.error?.message ?? 'Failed to load your bookings.'),
    });

    this.bookingService.getReceivedBookings().subscribe({
      next: bookings => {
        this.receivedBookings.set(bookings);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load received bookings.');
        this.isLoading.set(false);
      },
    });
  }
}
