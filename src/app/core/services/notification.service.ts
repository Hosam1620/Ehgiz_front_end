import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationType } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/notifications`;

  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal(false);
  readonly newNotification$ = new Subject<Notification>();

  private readonly _unreadCount = signal(0);

  readonly unreadCount = computed(() => {
    const list = this.notifications();
    return list.length > 0
      ? list.filter(n => !n.isRead).length
      : this._unreadCount();
  });

  loadUnreadCount() {
    return this.http
      .get<{ data: { count: number } }>(`${this.api}/unread/count`)
      .pipe(
        tap(res => {
          if (res?.data) {
            this._unreadCount.set(res.data.count);
          }
        })
      );
  }

  getNotifications() {
    this.isLoading.set(true);
    return this.http
      .get<{ data: Notification[] | null }>(this.api)
      .pipe(
        tap({
          next: res => {
            if (res?.data) {
              this.notifications.set(res.data.map(n => this.normalize(n)));
            }
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        })
      );
  }

  getUnread() {
    return this.http.get<{ data: Notification[] | null }>(`${this.api}/unread`);
  }

  prependNotification(notification: Notification) {
    const normalized = this.normalize(notification);
    this.notifications.update(list => [normalized, ...list]);
    this._unreadCount.update(count => count + 1);
    this.newNotification$.next(normalized);
  }

  private normalize(n: Notification): Notification {
    return { ...n, type: (n.type ?? '').toLowerCase() as NotificationType };
  }

  markAsRead(id: number) {
    return this.http
      .put<void>(`${this.api}/${id}/read`, {})
      .pipe(
        tap(() => {
          this.notifications.update(list =>
            list.map(n => (n.id === id ? { ...n, isRead: true } : n))
          );
        })
      );
  }

  markAllAsRead() {
    const prevList = this.notifications();
    const prevCount = this._unreadCount();
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this._unreadCount.set(0);

    return this.http.put<void>(`${this.api}/read-all`, {}).pipe(
      catchError(err => {
        this.notifications.set(prevList);
        this._unreadCount.set(prevCount);
        return throwError(() => err);
      })
    );
  }

  delete(id: number) {
    return this.http
      .delete<void>(`${this.api}/${id}`)
      .pipe(
        tap(() => {
          const wasUnread = this.notifications().find(n => n.id === id)?.isRead === false;
          this.notifications.update(list => list.filter(n => n.id !== id));
          if (wasUnread) {
            this._unreadCount.update(c => Math.max(0, c - 1));
          }
        })
      );
  }

  reset() {
    this.notifications.set([]);
    this._unreadCount.set(0);
  }
}
