import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ProfileService } from './core/services/profile.service';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  userName = signal<string>('');
  showSidebar = signal(true);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.fetchProfile();
      } else {
        this.userName.set('');
      }
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updateLayout();
    });
  }

  ngOnInit() {
    this.updateLayout();
    if (this.auth.isLoggedIn()) {
      this.fetchProfile();
    }
  }

  private updateLayout(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.showSidebar.set(route.data['layout'] !== 'full');
  }

  private fetchProfile() {
    if (this.userName()) return;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.userName.set(res.data.fullName);
        }
      }
    });
  }
}
