import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BrowseFilterStore } from '../../../features/tools/browse-filter.store';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationDropdownComponent, AvatarComponent],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly filterStore = inject(BrowseFilterStore);

  isLoggedIn = input(false);
  userName = input('');
  logoutClicked = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onSearch(term: string): void {
    const searchTerm = term.trim();
    this.filterStore.patch({ searchTerm, page: 1 });
    this.closeMobileMenu();
    this.router.navigate(['/browse'], { queryParams: { search: searchTerm || null } });
  }

  navigateTo(path: string): void {
    this.closeMenu();
    this.closeMobileMenu();
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.closeMenu();
    this.closeMobileMenu();
    this.logoutClicked.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if ((this.menuOpen() || this.mobileMenuOpen()) && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
    this.closeMobileMenu();
  }
}
