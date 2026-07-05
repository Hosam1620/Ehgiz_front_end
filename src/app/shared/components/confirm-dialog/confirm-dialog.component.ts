import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

/** Renders the active ConfirmService dialog. Include once in the root template. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (confirmService.active(); as dialog) {
      <div class="modal-overlay" (click)="confirmService.settle(false)">
        <div
          class="modal-dialog confirm-dialog anim-fade"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="dialog.title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h3 style="display:flex;align-items:center;gap:10px;">
              <span class="confirm-dialog-icon" [class.danger]="dialog.danger">
                <i [class]="dialog.danger ? 'fas fa-triangle-exclamation' : 'fas fa-circle-question'"></i>
              </span>
              {{ dialog.title }}
            </h3>
            <button type="button" class="modal-close" aria-label="Close" (click)="confirmService.settle(false)">×</button>
          </div>
          <div class="modal-body">
            <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin:0;">{{ dialog.message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="confirmService.settle(false)">{{ dialog.cancelLabel }}</button>
            <button
              type="button"
              class="btn"
              [class.btn-danger-solid]="dialog.danger"
              [class.btn-primary]="!dialog.danger"
              (click)="confirmService.settle(true)"
            >{{ dialog.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly confirmService = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.active()) {
      this.confirmService.settle(false);
    }
  }
}
