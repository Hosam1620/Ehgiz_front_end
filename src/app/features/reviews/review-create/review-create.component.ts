import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReviewService } from '../../../core/services/review.service';
import { BookingService } from '../../../core/services/booking.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  standalone: true,
  selector: 'app-review-create',
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent],
  templateUrl: './review-create.component.html',
})
export class ReviewCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reviewService = inject(ReviewService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly toolName = signal('');

  protected bookingId = 0;
  protected rating = 5;
  protected comment = '';
  protected readonly hoverRating = signal(0);
  protected readonly ratingWords = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId'));
    if (!this.bookingId) {
      this.error.set('No booking selected.');
      this.isLoading.set(false);
      return;
    }

    this.bookingService.getById(this.bookingId).subscribe({
      next: b => {
        this.toolName.set(b.toolName);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Could not load booking.');
        this.isLoading.set(false);
      },
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  submit(): void {
    if (this.rating < 1 || this.rating > 5) {
      this.toast.show('Invalid rating', 'Please select 1–5 stars.', 'warning');
      return;
    }

    this.isSubmitting.set(true);
    this.reviewService
      .create({ bookingId: this.bookingId, rating: this.rating, comment: this.comment || undefined })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Review submitted', 'Thank you for your feedback!', 'success');
          this.router.navigate(['/bookings', this.bookingId]);
        },
        error: err => this.toast.show('Error', err.error?.message ?? err.error?.title ?? 'Could not submit review.', 'error'),
      });
  }
}
