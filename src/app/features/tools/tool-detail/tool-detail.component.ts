import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { ToolsService } from '../../../core/services/tools.service';
import { BookingService } from '../../../core/services/booking.service';
import { ReviewService } from '../../../core/services/review.service';
import { Tool } from '../../../core/models/tool.model';
import { BookedDateRange, ToolAvailability } from '../../../core/models/booking.model';
import { Review } from '../../../core/models/review.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

@Component({
  standalone: true,
  selector: 'app-tool-detail',
  imports: [RouterModule, DecimalPipe, DatePipe, NgClass, LoadingSpinnerComponent],
  templateUrl: './tool-detail.component.html',
})
export class ToolDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toolsService = inject(ToolsService);
  private readonly bookingService = inject(BookingService);
  private readonly reviewService = inject(ReviewService);
  private readonly messageService = inject(MessageService);
  private readonly auth = inject(AuthService);

  protected readonly tool = signal<Tool | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly messageError = signal<string | null>(null);
  protected readonly isStartingConversation = signal(false);
  protected readonly selectedImageIndex = signal(0);
  protected readonly failedImages = signal<Set<string>>(new Set());

  protected readonly reviews = signal<Review[]>([]);
  protected readonly averageRating = signal<number | null>(null);
  protected readonly reviewsLoading = signal(false);

  protected readonly calendarYear = signal(new Date().getFullYear());
  protected readonly calendarMonth = signal(new Date().getMonth() + 1);
  protected readonly availability = signal<ToolAvailability | null>(null);
  protected readonly availabilityLoading = signal(false);
  protected readonly selectedStart = signal<Date | null>(null);
  protected readonly selectedEnd = signal<Date | null>(null);

  protected readonly rentalDays = computed(() => {
    const start = this.selectedStart();
    const end = this.selectedEnd();
    if (!start || !end) return 0;
    const days = Math.round((this.stripTime(end).getTime() - this.stripTime(start).getTime()) / 86400000);
    return days > 0 ? days : 0;
  });

  protected readonly subtotal = computed(() => {
    const t = this.tool();
    return t && this.rentalDays() > 0 ? t.pricePerDay * this.rentalDays() : 0;
  });

  protected readonly insuranceAmount = computed(() => {
    const t = this.tool();
    return t && this.rentalDays() > 0 && t.insurancePrice > 0 ? t.insurancePrice : 0;
  });

  protected readonly total = computed(() => this.subtotal() + this.insuranceAmount());

  protected readonly calendarWeeks = computed(() => this.buildCalendarWeeks(this.calendarYear(), this.calendarMonth()));

  protected readonly monthLabel = computed(() =>
    new Date(this.calendarYear(), this.calendarMonth() - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  );

  protected readonly canBook = computed(() => {
    const t = this.tool();
    return !!t && t.isAvailable && this.rentalDays() > 0 && !this.isOwnTool(t);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid tool id.');
      this.isLoading.set(false);
      return;
    }

    this.toolsService.getById(id).subscribe({
      next: tool => {
        this.tool.set(tool);
        this.isLoading.set(false);
        this.loadAvailability(id);
        this.loadReviews(id);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load tool.');
        this.isLoading.set(false);
      },
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  prevMonth(): void {
    let month = this.calendarMonth() - 1;
    let year = this.calendarYear();
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    this.calendarMonth.set(month);
    this.calendarYear.set(year);
    const tool = this.tool();
    if (tool) this.loadAvailability(tool.id);
  }

  nextMonth(): void {
    let month = this.calendarMonth() + 1;
    let year = this.calendarYear();
    if (month > 12) {
      month = 1;
      year += 1;
    }
    this.calendarMonth.set(month);
    this.calendarYear.set(year);
    const tool = this.tool();
    if (tool) this.loadAvailability(tool.id);
  }

  onCalendarDayClick(day: CalendarDay): void {
    if (!day.inMonth || this.isPast(day.date) || this.isDateBooked(day.date)) return;

    const start = this.selectedStart();
    const end = this.selectedEnd();

    if (!start || (start && end)) {
      this.selectedStart.set(this.stripTime(day.date));
      this.selectedEnd.set(null);
      return;
    }

    const clicked = this.stripTime(day.date);
    if (clicked <= start) {
      this.selectedStart.set(clicked);
      this.selectedEnd.set(null);
      return;
    }

    if (this.rangeHasBookedDate(start, clicked)) {
      this.selectedStart.set(clicked);
      this.selectedEnd.set(null);
      return;
    }

    this.selectedEnd.set(clicked);
  }

  dayClass(day: CalendarDay): Record<string, boolean> {
    const d = this.stripTime(day.date);
    const start = this.selectedStart();
    const end = this.selectedEnd();
    const inRange =
      !!start &&
      !!end &&
      d.getTime() >= start.getTime() &&
      d.getTime() <= end.getTime();

    return {
      'cal-day': true,
      'cal-day-out': !day.inMonth,
      'cal-day-booked': day.inMonth && this.isDateBooked(d),
      'cal-day-past': day.inMonth && this.isPast(d),
      'cal-day-selected': !!start && d.getTime() === start.getTime(),
      'cal-day-selected-end': !!end && d.getTime() === end.getTime(),
      'cal-day-in-range': inRange,
    };
  }

  bookNow(tool: Tool): void {
    const start = this.selectedStart();
    const end = this.selectedEnd();
    if (!start || !end) return;

    this.router.navigate(['/bookings/create'], {
      queryParams: {
        toolId: tool.id,
        startDate: this.toDateParam(start),
        endDate: this.toDateParam(end),
      },
    });
  }

  messageOwner(tool: Tool): void {
    this.messageError.set(null);

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/tools/${tool.id}` } });
      return;
    }

    if (this.isOwnTool(tool)) {
      this.router.navigate(['/tools']);
      return;
    }

    this.isStartingConversation.set(true);
    this.messageService
      .startOrGetConversation(tool.ownerId)
      .pipe(finalize(() => this.isStartingConversation.set(false)))
      .subscribe({
        next: conversation => this.router.navigate(['/messages', conversation.id]),
        error: err => {
          this.messageError.set(
            err.error?.message ?? err.error?.title ?? 'Could not open a conversation with this owner.'
          );
        },
      });
  }

  protected ownerInitials(name: string | null): string {
    if (!name) return 'O';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'O';
  }

  protected currentImage(tool: Tool): string | null {
    const urls = tool.imageUrls ?? [];
    if (!urls.length) return null;
    const failed = this.failedImages();
    const selected = urls[this.selectedImageIndex()];
    if (selected && !failed.has(selected)) return selected;
    return urls.find(url => !failed.has(url)) ?? null;
  }

  protected placeholderIcon(tool: Tool): string {
    const name = `${tool.categoryName ?? ''} ${tool.name ?? ''}`.toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return 'fas fa-camera';
    if (name.includes('clean') || name.includes('washer')) return 'fas fa-broom';
    if (name.includes('garden') || name.includes('lawn')) return 'fas fa-seedling';
    if (name.includes('construct') || name.includes('ladder')) return 'fas fa-helmet-safety';
    if (name.includes('electri') || name.includes('generat')) return 'fas fa-bolt';
    if (name.includes('wood') || name.includes('saw')) return 'fas fa-ruler-combined';
    if (name.includes('paint')) return 'fas fa-paint-roller';
    return 'fas fa-toolbox';
  }

  protected cardBg(tool: Tool): string {
    const name = (tool.categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '#EFF6FF';
    if (name.includes('power') || name.includes('drill')) return '#E8F4EE';
    if (name.includes('garden') || name.includes('lawn')) return '#E1F5EE';
    if (name.includes('electri') || name.includes('generat')) return '#FEF6E4';
    if (name.includes('wood') || name.includes('saw')) return '#F1EFE8';
    if (name.includes('construct')) return '#F1EFE8';
    return '#EFEFEA';
  }

  protected memberSince(createdAt: string): string {
    return new Date(createdAt).getFullYear().toString();
  }

  protected isOwnTool(tool: Tool): boolean {
    return this.auth.currentUser()?.id === tool.ownerId;
  }

  protected conditionLabel(condition: string | null): string | null {
    if (!condition) return null;
    const map: Record<string, string> = { '1': 'New', '2': 'Good', '3': 'Fair', '4': 'Poor' };
    return map[condition] ?? condition;
  }

  protected onImageError(url: string): void {
    this.failedImages.update(failed => {
      const next = new Set(failed);
      next.add(url);
      return next;
    });
  }

  protected reviewStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }

  protected reviewEmptyStars(rating: number): number[] {
    return Array.from({ length: 5 - rating }, (_, i) => i);
  }

  private loadAvailability(toolId: number): void {
    this.availabilityLoading.set(true);
    this.bookingService.getToolAvailability(toolId, this.calendarYear(), this.calendarMonth()).subscribe({
      next: data => {
        this.availability.set(data);
        this.availabilityLoading.set(false);
      },
      error: () => this.availabilityLoading.set(false),
    });
  }

  private loadReviews(toolId: number): void {
    this.reviewsLoading.set(true);
    this.reviewService.getByTool(toolId).subscribe({
      next: reviews => {
        this.reviews.set(reviews);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false),
    });
    this.reviewService.getToolRating(toolId).subscribe({
      next: r => this.averageRating.set(r.averageRating),
      error: () => {},
    });
  }

  private buildCalendarWeeks(year: number, month: number): CalendarDay[][] {
    const first = new Date(year, month - 1, 1);
    const startOffset = first.getDay();
    const gridStart = new Date(year, month - 1, 1 - startOffset);
    const weeks: CalendarDay[][] = [];

    for (let w = 0; w < 6; w++) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + d);
        week.push({ date, inMonth: date.getMonth() === month - 1 });
      }
      weeks.push(week);
    }
    return weeks;
  }

  protected isDateBooked(date: Date): boolean {
    return this.getRangeForDate(date) !== null;
  }

  private getRangeForDate(date: Date): BookedDateRange | null {
    const d = this.stripTime(date).getTime();
    const skip = new Set(['Cancelled', 'Rejected']);
    for (const range of this.availability()?.bookedRanges ?? []) {
      if (skip.has(range.status)) continue;
      const start = this.stripTime(new Date(range.startDate)).getTime();
      const end = this.stripTime(new Date(range.endDate)).getTime();
      if (d >= start && d <= end) return range;
    }
    return null;
  }

  private rangeHasBookedDate(start: Date, end: Date): boolean {
    const cursor = new Date(start);
    while (cursor <= end) {
      if (this.isDateBooked(cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  protected isPast(date: Date): boolean {
    const today = this.stripTime(new Date());
    return this.stripTime(date) < today;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toDateParam(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
