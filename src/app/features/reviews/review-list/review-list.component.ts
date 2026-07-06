import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ReviewService } from '../../../core/services/review.service';
import { BookingService } from '../../../core/services/booking.service';
import { Review } from '../../../core/models/review.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  standalone: true,
  selector: 'app-review-list',
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent],
  templateUrl: './review-list.component.html',
})
export class ReviewListComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly pendingBookingIds = signal<number[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  deleteReview(id: number): void {
    this.reviewService.delete(id).subscribe({
      next: () => {
        this.toast.show('Deleted', 'Review removed.', 'success');
        this.load();
      },
      error: err => this.toast.show('Error', err.error?.message ?? 'Could not delete review.', 'error'),
    });
  }

  stars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }

  emptyStars(rating: number): number[] {
    return Array.from({ length: 5 - rating }, (_, i) => i);
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.bookingService.getMyBookings().subscribe({
      next: bookings => {
        const pending = bookings
          .filter(b => b.allowedActions.includes('LeaveReview'))
          .map(b => b.id);
        this.pendingBookingIds.set(pending);

        const allBookingIds = new Set(bookings.map(b => b.id));
        const toolIds = [...new Set(bookings.map(b => b.toolId))];
        if (!toolIds.length) {
          this.reviews.set([]);
          this.isLoading.set(false);
          return;
        }

        forkJoin(toolIds.map(id => this.reviewService.getByTool(id))).subscribe({
          next: results => {
            const myReviews = results.flat().filter(r => allBookingIds.has(r.bookingId));
            this.reviews.set(myReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('Failed to load reviews.');
            this.isLoading.set(false);
          },
        });
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load bookings.');
        this.isLoading.set(false);
      },
    });
  }
}
