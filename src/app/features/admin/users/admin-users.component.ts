import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly actingId = signal<number | null>(null);

  /** ID of the user whose role picker is currently open */
  protected readonly rolePickerId = signal<number | null>(null);
  protected readonly roleInput = signal('user');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: list => {
        this.users.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load users.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  toggleActive(user: AdminUser): void {
    this.actingId.set(user.id);
    this.adminService
      .setUserActive(user.id, { isActive: !user.isActive })
      .pipe(finalize(() => this.actingId.set(null)))
      .subscribe({
        next: () => {
          this.users.update(list =>
            list.map(u => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
          );
          this.toast.show('Updated', `User ${user.isActive ? 'deactivated' : 'activated'}.`, 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Update failed.', 'error'),
      });
  }

  openRolePicker(user: AdminUser): void {
    this.rolePickerId.set(user.id);
    this.roleInput.set(user.roles[0] ?? 'user');
  }

  closeRolePicker(): void {
    this.rolePickerId.set(null);
  }

  saveRole(user: AdminUser): void {
    const role = this.roleInput();
    if (!role) return;
    this.actingId.set(user.id);
    this.adminService
      .setUserRole(user.id, { role })
      .pipe(finalize(() => this.actingId.set(null)))
      .subscribe({
        next: () => {
          this.users.update(list =>
            list.map(u => (u.id === user.id ? { ...u, roles: [role] } : u))
          );
          this.toast.show('Updated', `Role changed to "${role}".`, 'success');
          this.closeRolePicker();
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Role change failed.', 'error'),
      });
  }

  primaryRole(user: AdminUser): string {
    return user.roles[0] ?? 'user';
  }

  roleClass(role: string): string {
    return role === 'admin' ? 'chip-orange' : 'chip-blue';
  }
}
