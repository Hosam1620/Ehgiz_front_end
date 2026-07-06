import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { BookingCard, BookingStatus, HandoverSummary } from '../../../core/models/booking.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

type BookingTab = 'my' | 'received';

@Component({
  standalone: true,
  selector: 'app-booking-list',
  imports: [RouterLink, DecimalPipe, DatePipe, NgClass, LoadingSpinnerComponent, AvatarComponent],
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

  /** Accent colour used on the card's left edge and status dot. */
  statusAccent(status: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      Pending: 'var(--amber)',
      Accepted: 'var(--blue)',
      DeliveryHandover: 'var(--blue)',
      Active: 'var(--green)',
      ReturnHandover: 'var(--blue)',
      Completed: 'var(--text-3)',
      Rejected: 'var(--red)',
      Cancelled: 'var(--text-3)',
      Disputed: 'var(--red)',
    };
    return map[status] ?? 'var(--border-2)';
  }

  handoverChipClass(handover: HandoverSummary): string {
    if (handover.isAccepted === true) return 'chip-green';
    if (handover.isAccepted === false) return 'chip-red';
    if (handover.isSubmitted) return 'chip-amber';
    return 'chip-gray';
  }

  handoverLabel(handover: HandoverSummary): string {
    if (handover.isAccepted === true) return 'Accepted';
    if (handover.isAccepted === false) return 'Rejected';
    if (handover.isSubmitted) return 'Awaiting response';
    return 'Pending';
  }

  /** Count summary for the tab currently shown, used in the header strip. */
  protected readonly summary = computed(() => {
    const list = this.displayedBookings();
    const active = list.filter(b =>
      ['Accepted', 'DeliveryHandover', 'Active', 'ReturnHandover'].includes(b.status)
    ).length;
    const pending = list.filter(b => b.status === 'Pending').length;
    const completed = list.filter(b => b.status === 'Completed').length;
    return { total: list.length, active, pending, completed };
  });

  private loadBookings(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      my: this.bookingService.getMyBookings().pipe(catchError(() => of([] as BookingCard[]))),
      received: this.bookingService.getReceivedBookings().pipe(catchError(() => of([] as BookingCard[]))),
    }).subscribe({
      next: ({ my, received }) => {
        this.myBookings.set(my);
        this.receivedBookings.set(received);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load bookings.');
        this.isLoading.set(false);
      },
    });
  }
}
