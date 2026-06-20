import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ProfileService } from './core/services/profile.service';
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
  private readonly profileService = inject(ProfileService);
  private readonly notifService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);

  readonly userName = signal<string>('');
  readonly unreadCount = this.notifService.unreadCount;

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.fetchProfile();
        this.notifService.loadUnreadCount().subscribe();
        const token = this.auth.token();
        if (token) {
          this.hubService.startConnection(token);
        }
      } else {
        this.userName.set('');
        this.hubService.stopConnection();
      }
    });
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.fetchProfile();
      this.notifService.loadUnreadCount().subscribe();
      const token = this.auth.token();
      if (token) {
        this.hubService.startConnection(token);
      }
    }
  }

  private fetchProfile() {
    if (this.userName()) return;
    this.profileService.getProfile().subscribe({
      next: res => {
        if (res.succeeded && res.data) {
          this.userName.set(res.data.fullName);
        }
      },
    });
  }
}
