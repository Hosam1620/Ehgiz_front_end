import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.html',
})
export class NotificationDropdownComponent {
  private readonly notifService = inject(NotificationService);
  private readonly el = inject(ElementRef);

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
    if (opening) {
      this.notifService.getNotifications().subscribe();
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

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
