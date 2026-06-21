import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  templateUrl: './notification-dropdown.html',
})
export class NotificationDropdownComponent {
  private readonly notifService = inject(NotificationService);
  private readonly el = inject(ElementRef);
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  readonly notifications = this.notifService.notifications;
  readonly unreadCount = this.notifService.unreadCount;
  readonly isLoading = this.notifService.isLoading;

  readonly recentNotifications = computed(() => this.notifications().slice(0, 8));

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggle() {
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening && this.notifications().length === 0) {
      this.notifService.getNotifications().subscribe({ error: () => {} });
    }
  }

  close() {
    this.isOpen.set(false);
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe();
  }

  markAsRead(n: Notification) {
    if (!n.isRead) {
      this.notifService.markAsRead(n.id).subscribe();
    }
  }

  handleClick(n: Notification) {
    this.markAsRead(n);
    this.isOpen.set(false);
    if (n.url) {
      this.router.navigateByUrl(n.url);
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      booking: 'fas fa-calendar-check',
      review:  'fas fa-star',
      message: 'fas fa-comment-dots',
      payment: 'fas fa-coins',
      system:  'fas fa-robot',
    };
    return icons[type] ?? 'fas fa-bell';
  }
}

