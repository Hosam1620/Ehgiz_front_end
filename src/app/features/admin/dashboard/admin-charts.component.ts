import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { AdminService } from '../../../core/services/admin.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  AdminDashboardStats,
  AdminListing,
  AdminUser,
  AdminWalletTransaction,
} from '../../../core/models/admin.model';

interface MonthBucket {
  key: string;   // yyyy-MM
  label: string; // e.g. "Mar 26"
}

/** Last N calendar months including the current one. */
function lastMonths(count: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    });
  }
  return buckets;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  template: `
    <div style="margin:32px 0 8px;font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.6px;">Analytics</div>
    @if (error()) {
      <div class="alert alert-warning">{{ error() }}</div>
    }
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card-title"><i class="fas fa-chart-line"></i> Bookings over time</div>
        <div class="chart-card-sub">Booking payments per month (last 12 months)</div>
        <div class="chart-canvas-wrap"><canvas #bookingsCanvas></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title"><i class="fas fa-coins"></i> Revenue over time</div>
        <div class="chart-card-sub">Booking volume vs owner payouts (the gap approximates platform fees)</div>
        <div class="chart-canvas-wrap"><canvas #revenueCanvas></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title"><i class="fas fa-user-plus"></i> Users growth</div>
        <div class="chart-card-sub">Cumulative registered users</div>
        <div class="chart-canvas-wrap"><canvas #usersCanvas></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title"><i class="fas fa-tags"></i> Tools per category</div>
        <div class="chart-card-sub">Distribution of active listings</div>
        <div class="chart-canvas-wrap"><canvas #categoriesCanvas></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-title"><i class="fas fa-calendar-check"></i> Booking status breakdown</div>
        <div class="chart-card-sub">Active vs disputed vs settled bookings</div>
        <div class="chart-canvas-wrap"><canvas #statusCanvas></canvas></div>
      </div>
    </div>
  `,
})
export class AdminChartsComponent implements AfterViewInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly bookingsCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('bookingsCanvas');
  private readonly revenueCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('revenueCanvas');
  private readonly usersCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('usersCanvas');
  private readonly categoriesCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('categoriesCanvas');
  private readonly statusCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('statusCanvas');

  protected readonly error = signal<string | null>(null);

  private charts: Chart[] = [];
  private data: {
    stats: AdminDashboardStats | null;
    users: AdminUser[];
    transactions: AdminWalletTransaction[];
    listings: AdminListing[];
  } | null = null;
  private viewReady = false;

  constructor() {
    // Re-render with the new palette when the theme flips.
    effect(() => {
      this.themeService.theme();
      untracked(() => {
        if (this.viewReady && this.data) this.renderCharts();
      });
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    forkJoin({
      stats: this.adminService.getDashboardStats().pipe(catchError(() => of(null))),
      users: this.adminService.getUsers().pipe(catchError(() => of([] as AdminUser[]))),
      transactions: this.adminService.getAllTransactions().pipe(catchError(() => of([] as AdminWalletTransaction[]))),
      listings: this.adminService.getListings().pipe(catchError(() => of([] as AdminListing[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.data = data;
        if (!data.stats && !data.users.length && !data.transactions.length && !data.listings.length) {
          this.error.set('Analytics data could not be loaded.');
          return;
        }
        this.renderCharts();
      });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private renderCharts(): void {
    if (!this.data) return;
    this.destroyCharts();

    const green = this.cssVar('--green');
    const orange = this.cssVar('--orange');
    const blue = this.cssVar('--blue');
    const amber = this.cssVar('--amber');
    const red = this.cssVar('--red');
    const textColor = this.cssVar('--text-2');
    const gridColor = this.cssVar('--border');

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font.family = "'DM Sans', sans-serif";

    const months = lastMonths(12);
    const { users, transactions, listings, stats } = this.data;

    // Bookings over time: BookingDebit count per month
    const bookingDebits = transactions.filter(t => t.type === 'BookingDebit');
    const bookingsPerMonth = months.map(m => bookingDebits.filter(t => monthKey(t.createdAt) === m.key).length);

    this.charts.push(new Chart(this.bookingsCanvas().nativeElement, {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Bookings',
          data: bookingsPerMonth,
          borderColor: green,
          backgroundColor: green,
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        }],
      },
      options: this.lineOptions(),
    }));

    // Revenue: booking volume vs owner payouts per month
    const volumePerMonth = months.map(m =>
      bookingDebits.filter(t => monthKey(t.createdAt) === m.key)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );
    const earnings = transactions.filter(t => t.type === 'EarningCredit');
    const payoutsPerMonth = months.map(m =>
      earnings.filter(t => monthKey(t.createdAt) === m.key)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );

    this.charts.push(new Chart(this.revenueCanvas().nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          { label: 'Booking payments (EGP)', data: volumePerMonth, backgroundColor: green, borderRadius: 4 },
          { label: 'Owner payouts (EGP)', data: payoutsPerMonth, backgroundColor: orange, borderRadius: 4 },
        ],
      },
      options: this.lineOptions(),
    }));

    // Users growth: cumulative registrations
    const usersBefore = users.filter(u => monthKey(u.createdAt) < months[0].key).length;
    let running = usersBefore;
    const cumulativeUsers = months.map(m => {
      running += users.filter(u => monthKey(u.createdAt) === m.key).length;
      return running;
    });

    this.charts.push(new Chart(this.usersCanvas().nativeElement, {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Users',
          data: cumulativeUsers,
          borderColor: blue,
          backgroundColor: blue,
          tension: 0.35,
          pointRadius: 3,
          fill: false,
        }],
      },
      options: this.lineOptions(),
    }));

    // Tools per category (donut)
    const byCategory = new Map<string, number>();
    listings.forEach(l => {
      const name = l.categoryName ?? 'Uncategorized';
      byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
    });
    const categoryNames = [...byCategory.keys()];
    const palette = [green, orange, blue, amber, red, '#8B5CF6', '#0EA5E9', '#84CC16'];

    this.charts.push(new Chart(this.categoriesCanvas().nativeElement, {
      type: 'doughnut',
      data: {
        labels: categoryNames,
        datasets: [{
          data: categoryNames.map(n => byCategory.get(n) ?? 0),
          backgroundColor: categoryNames.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
        }],
      },
      options: this.pieOptions(),
    }));

    // Booking status breakdown (pie) from dashboard totals
    const active = stats?.activeBookings ?? 0;
    const disputed = stats?.disputedBookings ?? 0;
    const settled = Math.max(0, (stats?.totalBookings ?? 0) - active - disputed);

    this.charts.push(new Chart(this.statusCanvas().nativeElement, {
      type: 'pie',
      data: {
        labels: ['Active', 'Disputed', 'Completed / other'],
        datasets: [{
          data: [active, disputed, settled],
          backgroundColor: [green, red, blue],
          borderWidth: 0,
        }],
      },
      options: this.pieOptions(),
    }));
  }

  private lineOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { font: { size: 10 }, precision: 0 } },
      },
    } as const;
  }

  private pieOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' as const, labels: { boxWidth: 12, font: { size: 11 } } } },
    } as const;
  }
}
