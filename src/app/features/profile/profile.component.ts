import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: UserProfile | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.isLoading = false;
          if (res.succeeded && res.data) {
            this.profile = res.data;
          } else {
            this.errorMessage = res.message || 'Failed to load profile';
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'An error occurred while loading the profile.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
