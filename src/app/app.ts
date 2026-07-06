import { Component, inject, computed, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, NavigationStart } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { NotificationHubService } from './core/services/notification-hub.service';
import { ChatHubService } from './core/services/chat-hub.service';
import { MessageService } from './core/services/message.service';
import { ThemeService } from './core/services/theme.service';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { ToastContainerComponent } from './shared/components/toast/toast.component';
import { AiChatWidgetComponent } from './shared/components/ai-chat-widget/ai-chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, Footer, ToastContainerComponent, AiChatWidgetComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  // Injected for its side effect: applies the persisted theme on startup.
  private readonly themeService = inject(ThemeService);
  private readonly notifService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);
  private readonly chatHubService = inject(ChatHubService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.auth.currentUser()?.fullName ?? '');
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
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        // Flip the admin-isolated layout as soon as navigation *starts*, based on
        // the target URL. Waiting until NavigationEnd lets the admin component
        // render for a frame inside the normal user shell (sidebar + navbar),
        // which is the "user page flashes before the admin dashboard" glitch.
        if (event instanceof NavigationStart) {
          if (event.url.startsWith('/admin')) {
            this.isAdminRoute.set(true);
            this.showSidebar.set(false);
          }
        } else if (event instanceof NavigationEnd) {
          this.updateLayout();
        }
      });

    this.chatHubService.messageReceived$
      .pipe(takeUntilDestroyed())
      .subscribe(message => {
        this.messageService.applyIncomingMessage(message);
      });
  }

  logout(): void {
    this.auth.logout();
  }

  private updateLayout(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    // On the very first call (before NavigationEnd fires) route.data is empty.
    // Fall back to window.location so the initial render already has the right layout.
    const layout: string | undefined =
      route.data['layout'] ?? (window.location.pathname.startsWith('/admin') ? 'admin' : undefined);
    this.showSidebar.set(layout !== 'full' && layout !== 'admin');
    this.isAdminRoute.set(layout === 'admin');
  }
}
