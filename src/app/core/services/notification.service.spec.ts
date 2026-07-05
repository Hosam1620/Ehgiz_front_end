import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

const api = `${environment.apiUrl}/api/notifications`;

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    userId: 1,
    title: 'Title',
    message: 'Message',
    type: 'system',
    isRead: false,
    url: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Notification;
}

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loadUnreadCount stores the badge count', () => {
    service.loadUnreadCount().subscribe();
    http.expectOne(`${api}/unread/count`).flush({ data: { count: 4 } });

    expect(service.unreadCount()).toBe(4);
  });

  it('getNotifications normalizes types to lowercase and clears loading', () => {
    service.getNotifications().subscribe();
    expect(service.isLoading()).toBe(true);

    http.expectOne(api).flush({
      data: [makeNotification({ type: 'Booking' as Notification['type'] })],
    });

    expect(service.isLoading()).toBe(false);
    expect(service.notifications()[0].type).toBe('booking');
  });

  it('unreadCount is derived from the list once loaded', () => {
    service.getNotifications().subscribe();
    http.expectOne(api).flush({
      data: [
        makeNotification({ id: 1, isRead: false }),
        makeNotification({ id: 2, isRead: true }),
        makeNotification({ id: 3, isRead: false }),
      ],
    });

    expect(service.unreadCount()).toBe(2);
  });

  it('prependNotification adds to the top, bumps count and emits', () => {
    let emitted: Notification | undefined;
    service.newNotification$.subscribe(n => (emitted = n));

    service.prependNotification(makeNotification({ id: 9, type: 'Payment' as Notification['type'] }));

    expect(service.notifications()[0].id).toBe(9);
    expect(service.unreadCount()).toBe(1);
    expect(emitted?.type).toBe('payment');
  });

  it('markAsRead flips the flag on success', () => {
    service.getNotifications().subscribe();
    http.expectOne(api).flush({ data: [makeNotification({ id: 5 })] });

    service.markAsRead(5).subscribe();
    http.expectOne(`${api}/5/read`).flush(null);

    expect(service.notifications()[0].isRead).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('markAllAsRead is optimistic and rolls back on failure', () => {
    service.getNotifications().subscribe();
    http.expectOne(api).flush({ data: [makeNotification({ id: 1 }), makeNotification({ id: 2 })] });

    service.markAllAsRead().subscribe({ error: () => undefined });
    // Optimistically marked before the response arrives
    expect(service.unreadCount()).toBe(0);

    http.expectOne(`${api}/read-all`).flush(null, { status: 500, statusText: 'Server Error' });

    // Rolled back
    expect(service.unreadCount()).toBe(2);
  });

  it('delete removes the item and decrements the badge for unread ones', () => {
    service.getNotifications().subscribe();
    http.expectOne(api).flush({ data: [makeNotification({ id: 1 }), makeNotification({ id: 2, isRead: true })] });

    service.delete(1).subscribe();
    http.expectOne(`${api}/1`).flush(null);

    expect(service.notifications().map(n => n.id)).toEqual([2]);
    expect(service.unreadCount()).toBe(0);
  });

  it('reset clears all state', () => {
    service.prependNotification(makeNotification());
    service.reset();

    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });
});
