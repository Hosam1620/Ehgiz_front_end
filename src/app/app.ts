import { Component, inject, computed, effect, signal } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { NotificationHubService } from './core/services/notification-hub.service';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { ToastContainerComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, Navbar, Footer, ToastContainerComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.auth.currentUser()?.fullName ?? '');
  readonly unreadCount = this.notifService.unreadCount;
  showSidebar = signal(true);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.notifService.loadUnreadCount().subscribe({ error: () => {} });
        this.hubService.startConnection();
      } else {
        this.hubService.stopConnection();
      }
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updateLayout();
    });
  }

  private updateLayout(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.showSidebar.set(route.data['layout'] !== 'full');
  }
}
