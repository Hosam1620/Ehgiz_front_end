import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './navbar.html',
})
export class Navbar {
  @Input() isLoggedIn = false;
  @Input() userName = '';
  @Input() unreadCount = 0;
  @Output() logoutClicked = new EventEmitter<void>();

  onLogout() {
    this.logoutClicked.emit();
  }
}
