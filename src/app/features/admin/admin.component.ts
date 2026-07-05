import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingDetail, BookingStatus, Handover } from '../../core/models/booking.model';
import { DisputeDetails, IssueReport, IssueReportStatus } from '../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { resolveMediaUrl } from '../../core/utils/media-url';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminListingsComponent } from './listings/admin-listings.component';
import { AdminCategoriesComponent } from './categories/admin-categories.component';
import { AdminWalletsComponent } from './wallets/admin-wallets.component';
import { AdminTransactionsComponent } from './transactions/admin-transactions.component';

type AdminTab = 'dashboard' | 'disputes' | 'issues' | 'settings' | 'users' | 'listings' | 'categories' | 'wallets' | 'transactions';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe, NgClass, LoadingSpinnerComponent,
    AvatarComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminListingsComponent,
    AdminCategoriesComponent,
    AdminWalletsComponent,
    AdminTransactionsComponent,
  ],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  protected readonly auth = inject(AuthService);

  protected readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
  });
  protected readonly userName = computed(() => this.auth.currentUser()?.fullName ?? 'Admin');

  protected readonly activeTab = signal<AdminTab>('dashboard');
  protected readonly disputes = signal<BookingDetail[]>([]);
  protected readonly issueReports = signal<IssueReport[]>([]);
  protected readonly selectedDispute = signal<DisputeDetails | null>(null);
  protected readonly selectedIssue = signal<IssueReport | null>(null);
  protected readonly platformFee = signal(10);
  protected readonly feeInput = signal(10);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingDispute = signal(false);
  protected readonly isActing = signal(false);
  protected readonly resolutionNotes = signal('');
  protected readonly showPartialRefundModal = signal(false);
  protected readonly partialRefundPercent = signal(50);

  protected readonly resolveMediaUrl = resolveMediaUrl;

  private feeLoaded = false;

  ngOnInit(): void {
    // Disputes + issues load eagerly — their counts drive the sidebar badges.
    this.loadDisputes();
    this.loadIssueReports();
    // Platform fee has no sidebar badge; defer to first settings open.
  }

  async confirmLogout(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out of the admin panel?',
      confirmLabel: 'Sign out',
      danger: true,
    });
    if (confirmed) {
      this.auth.logout();
    }
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.selectedDispute.set(null);
    this.selectedIssue.set(null);
    this.showPartialRefundModal.set(false);
    if (tab === 'settings' && !this.feeLoaded) {
      this.feeLoaded = true;
      this.adminService.getPlatformFee().subscribe({
        next: fee => {
          this.platformFee.set(fee);
          this.feeInput.set(fee);
        },
        error: () => {},
      });
    }
  }

  loadDisputes(): void {
    this.isLoading.set(true);
    this.adminService.getDisputes().subscribe({
      next: list => {
        this.disputes.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load disputes.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  loadIssueReports(): void {
    this.adminService.getIssueReports().subscribe({
      next: list => this.issueReports.set(list),
      error: () => {},
    });
  }

  viewDispute(bookingId: number): void {
    this.isLoadingDispute.set(true);
    this.selectedDispute.set(null);
    this.resolutionNotes.set('');
    this.adminService.getDisputeDetails(bookingId).subscribe({
      next: details => {
        this.selectedDispute.set(details);
        this.isLoadingDispute.set(false);
      },
      error: err => {
        this.isLoadingDispute.set(false);
        this.toast.show('Error', err.error?.message ?? 'Failed to load dispute.', 'error');
      },
    });
  }

  closeDisputeDetail(): void {
    this.selectedDispute.set(null);
    this.showPartialRefundModal.set(false);
  }

  openPartialRefundModal(): void {
    this.partialRefundPercent.set(50);
    this.showPartialRefundModal.set(true);
  }

  closePartialRefundModal(): void {
    this.showPartialRefundModal.set(false);
  }

  submitPartialRefund(): void {
    const details = this.selectedDispute();
    if (!details) return;

    const refundPercentage = this.partialRefundPercent();
    if (Number.isNaN(refundPercentage) || refundPercentage < 1 || refundPercentage > 99) {
      this.toast.show('Invalid percentage', 'Enter a value between 1 and 99.', 'warning');
      return;
    }

    this.isActing.set(true);
    this.adminService
      .partialRefund(details.booking.id, {
        refundPercentage,
        resolutionNotes: this.resolutionNotes() || undefined,
      })
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Resolved', `Partial refund of ${refundPercentage}% applied.`, 'success');
          this.showPartialRefundModal.set(false);
          this.closeDisputeDetail();
          this.loadDisputes();
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Partial refund failed.', 'error'),
      });
  }

  resolve(action: 'owner' | 'renter' | 'complete' | 'cancel'): void {
    const details = this.selectedDispute();
    if (!details) return;

    const id = details.booking.id;
    const notes = { resolutionNotes: this.resolutionNotes() || undefined };

    const request$ = (() => {
      switch (action) {
        case 'owner':   return this.adminService.resolveForOwner(id, notes);
        case 'renter':  return this.adminService.resolveForRenter(id, notes);
        case 'complete': return this.adminService.forceComplete(id, notes);
        case 'cancel':  return this.adminService.forceCancel(id, notes);
      }
    })();

    this.isActing.set(true);
    request$
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Resolved', 'Dispute updated.', 'success');
          this.closeDisputeDetail();
          this.loadDisputes();
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Resolution failed.', 'error'),
      });
  }

  viewIssue(issue: IssueReport): void {
    this.selectedIssue.set(issue);
  }

  closeIssueDetail(): void {
    this.selectedIssue.set(null);
  }

  updateIssueStatus(report: IssueReport, status: IssueReportStatus): void {
    this.adminService.updateIssueStatus(report.id, { status }).subscribe({
      next: () => {
        this.toast.show('Updated', `Status set to ${status}.`, 'success');
        this.issueReports.update(list =>
          list.map(r => (r.id === report.id ? { ...r, status } : r))
        );
        if (this.selectedIssue()?.id === report.id) {
          this.selectedIssue.update(r => (r ? { ...r, status } : null));
        }
      },
      error: err => this.toast.show('Error', err.error?.message ?? 'Update failed.', 'error'),
    });
  }

  savePlatformFee(): void {
    const fee = this.feeInput();
    this.isActing.set(true);
    this.adminService
      .updatePlatformFee({ feePercent: fee })
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: res => {
          this.platformFee.set(res.feePercent);
          this.toast.show('Saved', res.message, 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not update fee.', 'error'),
      });
  }

  disputeHandovers(dispute: DisputeDetails): Handover[] {
    const h = dispute.handovers;
    return Array.isArray(h) ? h : h ? [...h] : [];
  }

  disputeIssues(dispute: DisputeDetails): IssueReport[] {
    const i = dispute.issues;
    return Array.isArray(i) ? i : i ? [...i] : [];
  }

  readonly openIssuesCount = computed(() =>
    this.issueReports().filter(r => r.status === 'Open' || r.status === 'UnderReview').length
  );

  issueStatusClass(status: IssueReportStatus): string {
    const map: Record<IssueReportStatus, string> = {
      Open:        'chip-red',
      UnderReview: 'chip-amber',
      Resolved:    'chip-green',
    };
    return map[status] ?? 'chip-gray';
  }

  statusClass(status: BookingStatus): string {
    return status === 'Disputed' ? 'chip-red' : 'chip-amber';
  }

  handoverStatusLabel(h: Handover): string {
    if (h.isAccepted === true) return 'Accepted';
    if (h.isAccepted === false) return 'Rejected';
    return 'Pending response';
  }
}
