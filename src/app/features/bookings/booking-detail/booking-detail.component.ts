import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingDetail, BookingStatus, RespondHandoverRequest } from '../../../core/models/booking.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { resolveMediaUrl } from '../../../core/utils/media-url';

type ModalType = 'delivery' | 'return' | 'respond-delivery' | 'respond-return' | 'issue' | null;

@Component({
  standalone: true,
  selector: 'app-booking-detail',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, NgClass, LoadingSpinnerComponent],
  templateUrl: './booking-detail.component.html',
})
export class BookingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly messageService = inject(MessageService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly booking = signal<BookingDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isActing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected activeModal = signal<ModalType>(null);
  protected handoverNotes = '';
  protected handoverImages: File[] = [];
  protected respondAccept = true;
  protected respondNotes = '';
  protected issueTitle = '';
  protected issueDescription = '';

  protected readonly resolveMediaUrl = resolveMediaUrl;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid booking id.');
      this.isLoading.set(false);
      return;
    }
    this.loadBooking(id);
  }

  protected isOwner(): boolean {
    const b = this.booking();
    return !!b && this.auth.currentUser()?.id === b.ownerId;
  }

  protected can(action: string): boolean {
    return this.booking()?.allowedActions.includes(action as never) ?? false;
  }

  protected otherPartyId(): number | null {
    const b = this.booking();
    if (!b) return null;
    return this.isOwner() ? b.renterId : b.ownerId;
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

  reload(): void {
    const b = this.booking();
    if (b) this.loadBooking(b.id);
  }

  openModal(type: ModalType): void {
    this.handoverNotes = '';
    this.handoverImages = [];
    this.respondAccept = true;
    this.respondNotes = '';
    this.issueTitle = '';
    this.issueDescription = '';
    this.activeModal.set(type);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handoverImages = input.files ? Array.from(input.files) : [];
  }

  acceptBooking(): void {
    this.runAction(id => this.bookingService.accept(id), 'Booking accepted.');
  }

  rejectBooking(): void {
    this.runAction(id => this.bookingService.reject(id), 'Booking rejected.');
  }

  cancelBooking(): void {
    this.runAction(id => this.bookingService.cancel(id), 'Booking cancelled.');
  }

  submitHandover(): void {
    const b = this.booking();
    const modal = this.activeModal();
    if (!b || !modal) return;

    const request =
      modal === 'delivery'
        ? this.bookingService.submitDeliveryHandover(b.id, this.handoverNotes || null, this.handoverImages)
        : this.bookingService.submitReturnHandover(b.id, this.handoverNotes || null, this.handoverImages);

    this.isActing.set(true);
    request.pipe(finalize(() => this.isActing.set(false))).subscribe({
      next: () => {
        this.toast.show('Handover submitted', 'Waiting for the other party to confirm.', 'success');
        this.closeModal();
        this.reload();
      },
      error: err => this.toast.show('Error', err.error?.message ?? 'Could not submit handover.', 'error'),
    });
  }

  submitRespondHandover(): void {
    const b = this.booking();
    const modal = this.activeModal();
    if (!b || !modal) return;

    const data: RespondHandoverRequest = { accept: this.respondAccept, notes: this.respondNotes || undefined };
    const request =
      modal === 'respond-delivery'
        ? this.bookingService.respondDeliveryHandover(b.id, data)
        : this.bookingService.respondReturnHandover(b.id, data);

    this.isActing.set(true);
    request.pipe(finalize(() => this.isActing.set(false))).subscribe({
      next: () => {
        this.toast.show('Response recorded', this.respondAccept ? 'Handover accepted.' : 'Issue reported.', 'success');
        this.closeModal();
        this.reload();
      },
      error: err => this.toast.show('Error', err.error?.message ?? 'Could not respond to handover.', 'error'),
    });
  }

  submitIssue(): void {
    const b = this.booking();
    if (!b || !this.issueTitle.trim() || !this.issueDescription.trim()) {
      this.toast.show('Missing fields', 'Please enter a title and description.', 'warning');
      return;
    }

    this.isActing.set(true);
    this.bookingService
      .reportIssue(b.id, { title: this.issueTitle.trim(), description: this.issueDescription.trim() })
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Issue reported', 'An admin will review this dispute.', 'success');
          this.closeModal();
          this.reload();
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not report issue.', 'error'),
      });
  }

  messageOtherParty(): void {
    const recipientId = this.otherPartyId();
    if (!recipientId) return;

    this.isActing.set(true);
    this.messageService
      .startOrGetConversation(recipientId)
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: conv => this.router.navigate(['/messages', conv.id]),
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not open conversation.', 'error'),
      });
  }

  leaveReview(): void {
    const b = this.booking();
    if (b) this.router.navigate(['/reviews/create'], { queryParams: { bookingId: b.id } });
  }

  private loadBooking(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.bookingService.getById(id).subscribe({
      next: booking => {
        this.booking.set(booking);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load booking.');
        this.isLoading.set(false);
      },
    });
  }

  private runAction(action: (id: number) => ReturnType<BookingService['accept']>, successMsg: string): void {
    const b = this.booking();
    if (!b) return;

    this.isActing.set(true);
    action(b.id)
      .pipe(finalize(() => this.isActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Success', successMsg, 'success');
          this.reload();
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Action failed.', 'error'),
      });
  }
}
