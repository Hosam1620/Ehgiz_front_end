import { Component, ElementRef, viewChild, input, output } from '@angular/core';

declare const bootstrap: any;

@Component({
  selector: 'app-confirmation-modal',
  imports: [],
  templateUrl: './confirmation-modal.component.html',
})
export class ConfirmationModalComponent {
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed?');
  confirmLabel = input<string>('Confirm');
  cancelLabel = input<string>('Cancel');
  confirmClass = input<string>('btn-danger');

  confirmed = output<void>();
  cancelled = output<void>();

  private readonly modalEl = viewChild<ElementRef<HTMLElement>>('modalEl');
  private bsModal: any;

  open(): void {
    this.bsModal = new bootstrap.Modal(this.modalEl()!.nativeElement);
    this.bsModal.show();
  }

  onConfirm(): void {
    this.bsModal?.hide();
    this.confirmed.emit();
  }

  onCancel(): void {
    this.bsModal?.hide();
    this.cancelled.emit();
  }
}
