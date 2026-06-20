import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(title: string, body = '', type: Toast['type'] = 'info', duration = 4000) {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { id, title, body, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
