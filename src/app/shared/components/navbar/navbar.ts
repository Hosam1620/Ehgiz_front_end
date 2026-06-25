import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationDropdownComponent],
  templateUrl: './navbar.html',
})
export class Navbar {
  public auth = inject(AuthService);

  isLoggedIn = input(false);
  userName = input('');
  logoutClicked = output<void>();

  onLogout() {
    this.logoutClicked.emit();
  }
}
