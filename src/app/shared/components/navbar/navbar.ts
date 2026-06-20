import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './navbar.html',
})
export class Navbar {
  public auth = inject(AuthService);
  
  @Input() isLoggedIn = false;
  @Input() userName = '';
  @Output() logoutClicked = new EventEmitter<void>();

  onLogout() {
    this.logoutClicked.emit();
  }
}
