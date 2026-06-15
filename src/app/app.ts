import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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

  userName = signal<string>('');

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.fetchProfile();
      } else {
        this.userName.set('');
      }
    });
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.fetchProfile();
    }
  }

  private fetchProfile() {
    if (this.userName()) return; // Already fetched
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.userName.set(res.data.fullName);
        }
      }
    });
  }
}
