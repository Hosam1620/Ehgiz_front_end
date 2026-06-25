import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool } from '../../../core/models/tool.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  standalone: true,
  selector: 'app-booking-create',
  imports: [RouterLink, FormsModule, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './booking-create.component.html',
})
export class BookingCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toolsService = inject(ToolsService);
  private readonly toast = inject(ToastService);

  protected readonly tool = signal<Tool | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');

  protected readonly rentalDays = computed(() => {
    const s = this.startDate();
    const e = this.endDate();
    if (!s || !e) return 0;
    const diff = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  });

  protected readonly rentalCost = computed(() => {
    const t = this.tool();
    return t ? t.pricePerDay * this.rentalDays() : 0;
  });

  protected readonly insuranceAmount = computed(() => {
    const t = this.tool();
    return t && this.rentalDays() > 0 ? (t.insurancePrice ?? 0) : 0;
  });

  protected readonly totalCharged = computed(() => this.rentalCost() + this.insuranceAmount());

  ngOnInit(): void {
    const toolId = Number(this.route.snapshot.queryParamMap.get('toolId'));
    if (!toolId) {
      this.error.set('No tool selected. Browse tools and click Book now.');
      this.isLoading.set(false);
      return;
    }

    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 3);

    const qpStart = this.route.snapshot.queryParamMap.get('startDate');
    const qpEnd = this.route.snapshot.queryParamMap.get('endDate');
    this.startDate.set(qpStart ?? this.formatDate(today));
    this.endDate.set(qpEnd ?? this.formatDate(defaultEnd));

    this.toolsService.getById(toolId).subscribe({
      next: tool => {
        this.tool.set(tool);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load tool.');
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    const tool = this.tool();
    if (!tool || this.rentalDays() <= 0) {
      this.error.set('Please select valid start and end dates.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.bookingService
      .create({
        toolId: tool.id,
        startDate: this.startDate(),
        endDate: this.endDate(),
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: res => {
          this.toast.show('Booking created', `Charged ${res.totalCharged} ${res.currency.toUpperCase()} from wallet.`, 'success');
          this.router.navigate(['/bookings', res.bookingId]);
        },
        error: err => {
          const msg = err.error?.message ?? err.error?.title ?? 'Could not create booking.';
          this.error.set(msg);
          if (msg.toLowerCase().includes('balance') || msg.toLowerCase().includes('wallet')) {
            this.toast.show('Insufficient balance', 'Top up your wallet to complete this booking.', 'warning');
          }
        },
      });
  }

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
