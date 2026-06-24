import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';
import { Notification } from '../../../core/models/notification.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [RouterModule, TimeAgoPipe],
  templateUrl: './notification-dropdown.html',
})
export class NotificationDropdownComponent {
  private readonly notifService = inject(NotificationService);
  private readonly messageService = inject(MessageService);
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

  handleClick(n: Notification): void {
    this.markAsRead(n);
    this.isOpen.set(false);

    if (n.type === 'message') {
      this.openMessageChat(n);
      return;
    }

    let path = n.url?.trim() ?? '';
    if (path.startsWith('http')) {
      try {
        const parsed = new URL(path);
        path = parsed.pathname + parsed.search;
      } catch {
        path = '';
      }
    }
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  private openMessageChat(n: Notification): void {
    // 1. Conversation ID embedded directly in the notification
    if (n.conversationId) {
      this.router.navigate(['/messages', n.conversationId]);
      return;
    }

    // 2. Conversation ID encoded in the URL  (e.g. /messages/5)
    const urlPath = this.extractPath(n.url);
    const match = urlPath?.match(/^\/messages\/(\d+)$/);
    if (match) {
      this.router.navigate(['/messages', Number(match[1])]);
      return;
    }

    // 3. We know the sender — ask the backend for (or create) the conversation
    if (n.senderId) {
      this.messageService.startOrGetConversation(n.senderId).subscribe({
        next: conv => this.router.navigate(['/messages', conv.id]),
        error: ()  => this.router.navigate(['/messages']),
      });
      return;
    }

    // 4. Nothing to go on — open the inbox
    this.router.navigate(['/messages']);
  }

  private extractPath(url: string | null | undefined): string {
    const raw = url?.trim() ?? '';
    if (!raw) return '';
    if (raw.startsWith('http')) {
      try {
        return new URL(raw).pathname;
      } catch {
        return '';
      }
    }
    return raw.startsWith('/') ? raw : '/' + raw;
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
}

