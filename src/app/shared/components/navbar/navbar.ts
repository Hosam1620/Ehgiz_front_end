import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
})
export class Navbar {
  @Input() isLoggedIn = false;
  @Input() userName = '';
  @Output() logoutClicked = new EventEmitter<void>();

  onLogout() {
    this.logoutClicked.emit();
  }
}
