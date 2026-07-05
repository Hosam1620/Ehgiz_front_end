import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive style. */
  danger?: boolean;
}

interface ActiveConfirm extends Required<Omit<ConfirmOptions, 'danger'>> {
  danger: boolean;
  resolve: (confirmed: boolean) => void;
}

/**
 * App-wide replacement for window.confirm. Call confirm(...) to get a promise
 * that resolves true/false; the dialog itself is rendered once by
 * <app-confirm-dialog> in the root component.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly active = signal<ActiveConfirm | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    // Settle any dialog that is somehow still open before showing the new one.
    this.active()?.resolve(false);

    return new Promise<boolean>(resolve => {
      this.active.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  settle(confirmed: boolean): void {
    const current = this.active();
    if (!current) return;
    this.active.set(null);
    current.resolve(confirmed);
  }
}
