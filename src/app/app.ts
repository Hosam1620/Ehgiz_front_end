import { Component, inject, computed, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { NotificationHubService } from './core/services/notification-hub.service';
import { ChatHubService } from './core/services/chat-hub.service';
import { MessageService } from './core/services/message.service';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { ToastContainerComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, Footer, ToastContainerComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);
  private readonly chatHubService = inject(ChatHubService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.auth.currentUser()?.fullName ?? '');
  readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
  });
  readonly unreadCount = this.notifService.unreadCount;
  readonly unreadMessageCount = this.messageService.unreadCount;
  showSidebar = signal(true);
  isAdminRoute = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.notifService.loadUnreadCount().subscribe({ error: () => {} });
        this.messageService.getConversations().subscribe({ error: () => {} });
        this.hubService.startConnection();
        this.chatHubService.startConnection();
      } else {
        this.hubService.stopConnection();
        this.chatHubService.stopConnection();
        this.notifService.reset();
        this.messageService.conversations.set([]);
      }
    });

    this.updateLayout();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        this.updateLayout();
      });

    this.chatHubService.messageReceived$
      .pipe(takeUntilDestroyed())
      .subscribe(message => {
        this.messageService.applyIncomingMessage(message);
      });
  }

  private updateLayout(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const layout = route.data['layout'];
    this.showSidebar.set(layout !== 'full' && layout !== 'admin');
    this.isAdminRoute.set(layout === 'admin');
  }
}
