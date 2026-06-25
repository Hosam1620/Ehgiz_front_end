import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  signal,
  computed,
  viewChild,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationHubService } from '../../../core/services/notification-hub.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { ToastService } from '../../../shared/components/toast/toast.service';

type TypeFilter = NotificationType | 'all';

const DISPLAY_STEP = 20;

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [NgStyle, TimeAgoPipe],
  templateUrl: './notification-list.component.html',
})
export class NotificationListComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly scrollSentinel = viewChild<ElementRef>('scrollSentinel');

  private readonly notifService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private observer?: IntersectionObserver;

  readonly isHubConnected = this.hubService.isConnected;
  readonly notifications = this.notifService.notifications;
  readonly isLoading = this.notifService.isLoading;
  readonly unreadCount = this.notifService.unreadCount;

  readonly activeTab = signal<'all' | 'unread'>('all');
  readonly searchQuery = signal('');
  readonly activeTypeFilter = signal<TypeFilter>('all');
  readonly displayCount = signal(DISPLAY_STEP);

  readonly typeFilters: { value: TypeFilter; label: string; icon: string }[] = [
    { value: 'all',              label: 'All',      icon: 'fas fa-th' },
    { value: 'booking',          label: 'Booking',  icon: 'fas fa-calendar-check' },
    { value: 'payment',          label: 'Payment',  icon: 'fas fa-coins' },
    { value: 'message',          label: 'Message',  icon: 'fas fa-comment-dots' },
    { value: 'review',           label: 'Review',   icon: 'fas fa-star' },
    { value: 'issuereport',      label: 'Issue',    icon: 'fas fa-flag' },
    { value: 'handoverpending',  label: 'Handover', icon: 'fas fa-exchange-alt' },
    { value: 'handoveraccepted', label: 'Accepted', icon: 'fas fa-check-circle' },
    { value: 'handoverdisputed', label: 'Disputed', icon: 'fas fa-gavel' },
    { value: 'disputeresolved',  label: 'Resolved', icon: 'fas fa-handshake' },
    { value: 'system',           label: 'System',   icon: 'fas fa-robot' },
  ];

  readonly filteredNotifications = computed(() => {
    let list = this.notifications();

    if (this.activeTab() === 'unread') {
      list = list.filter(n => !n.isRead);
    }

    const type = this.activeTypeFilter();
    if (type !== 'all') {
      list = list.filter(n => n.type === type);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          (n.message ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  readonly visibleNotifications = computed(() =>
    this.filteredNotifications().slice(0, this.displayCount())
  );

  readonly hasMore = computed(
    () => this.filteredNotifications().length > this.displayCount()
  );

  ngOnInit() {
    this.notifService.reset();
    this.notifService.getNotifications().subscribe();
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && this.hasMore() && !this.isLoading()) {
          this.displayCount.update(n => n + DISPLAY_STEP);
        }
      },
      { rootMargin: '100px' }
    );
    const sentinel = this.scrollSentinel();
    if (sentinel?.nativeElement) {
      this.observer.observe(sentinel.nativeElement);
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  switchTab(tab: 'all' | 'unread') {
    this.activeTab.set(tab);
    this.displayCount.set(DISPLAY_STEP);
  }

  setTypeFilter(type: TypeFilter) {
    this.activeTypeFilter.set(type);
    this.displayCount.set(DISPLAY_STEP);
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.displayCount.set(DISPLAY_STEP);
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      error: () => this.toast.show('Error', 'Failed to mark all notifications as read.', 'error'),
    });
  }

  markAsRead(notification: Notification) {
    if (!notification.isRead) {
      this.notifService.markAsRead(notification.id).subscribe();
    }
  }

  handleClick(notification: Notification) {
    this.markAsRead(notification);
    if (notification.url) {
      this.router.navigateByUrl(notification.url);
    }
  }

  deleteNotification(event: MouseEvent, notification: Notification) {
    event.stopPropagation();
    this.notifService.delete(notification.id).subscribe();
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      booking:          'fas fa-calendar-check',
      review:           'fas fa-star',
      message:          'fas fa-comment-dots',
      payment:          'fas fa-coins',
      system:           'fas fa-robot',
      issuereport:      'fas fa-flag',
      handoverpending:  'fas fa-exchange-alt',
      handoveraccepted: 'fas fa-check-circle',
      handoverdisputed: 'fas fa-gavel',
      disputeresolved:  'fas fa-handshake',
    };
    return icons[type] ?? 'fas fa-bell';
  }

  getTypeIconStyle(type: string): { background: string; color: string } {
    const styles: Record<string, { background: string; color: string }> = {
      booking:          { background: 'var(--green-light)',  color: 'var(--green)'  },
      review:           { background: 'var(--amber-light)',  color: 'var(--amber)'  },
      message:          { background: 'var(--blue-light)',   color: 'var(--blue)'   },
      payment:          { background: 'var(--orange-light)', color: 'var(--orange)' },
      system:           { background: 'var(--surface2)',     color: 'var(--text-3)' },
      issuereport:      { background: 'var(--red-light)',    color: 'var(--red)'    },
      handoverpending:  { background: 'var(--orange-light)', color: 'var(--orange)' },
      handoveraccepted: { background: 'var(--green-light)',  color: 'var(--green)'  },
      handoverdisputed: { background: 'var(--red-light)',    color: 'var(--red)'    },
      disputeresolved:  { background: 'var(--green-light)',  color: 'var(--green)'  },
    };
    return styles[type] ?? { background: 'var(--surface2)', color: 'var(--text-3)' };
  }

}
