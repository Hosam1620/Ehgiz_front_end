import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToolsService } from '../../core/services/tools.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toolsService = inject(ToolsService);
  private readonly messageService = inject(MessageService);
  private readonly notificationService = inject(NotificationService);

  protected readonly toolsListedCount = signal<number | null>(null);
  protected readonly toolsError = signal(false);
  protected readonly unreadMessages = this.messageService.unreadCount;
  protected readonly unreadNotifications = this.notificationService.unreadCount;

  protected readonly messageSummary = computed(() => {
    const count = this.unreadMessages();
    return count === 1 ? '1 unread message' : `${count} unread messages`;
  });

  protected readonly notificationSummary = computed(() => {
    const count = this.unreadNotifications();
    return count === 1 ? '1 unread notification' : `${count} unread notifications`;
  });

  protected readonly firstName = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ')[0] || 'there';
  });

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  ngOnInit(): void {
    this.toolsService.getMyTools().subscribe({
      next: tools => this.toolsListedCount.set(tools.length),
      error: () => {
        this.toolsListedCount.set(null);
        this.toolsError.set(true);
      },
    });

    this.notificationService.loadUnreadCount().subscribe({ error: () => {} });
  }
}
