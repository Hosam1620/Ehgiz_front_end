import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { resolveMediaUrl } from '../../../core/utils/media-url';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, LoadingSpinnerComponent, AvatarComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly resolveMediaUrl = resolveMediaUrl;

  protected readonly allUsers = signal<AdminUser[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly actingId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly users = computed(() => {
    const filter = this.statusFilter();
    const list = this.allUsers();
    if (filter === 'active') return list.filter(u => u.isActive);
    if (filter === 'inactive') return list.filter(u => !u.isActive);
    return list;
  });

  protected readonly activeCount = computed(() => this.allUsers().filter(u => u.isActive).length);
  protected readonly inactiveCount = computed(() => this.allUsers().filter(u => !u.isActive).length);

  /** ID of the user whose role picker is currently open */
  protected readonly selectedUser = signal<AdminUser | null>(null);

  protected readonly rolePickerId = signal<number | null>(null);
  protected readonly roleInput = signal('user');

  ngOnInit(): void {
    this.load();
  }

  openDetail(user: AdminUser): void {
    this.closeRolePicker();
    this.selectedUser.set(user);
    // The list DTO has no nationalIdImageUrl, so fetch the full details for the ID image.
    this.adminService.getUserById(user.id).subscribe({
      next: full => {
        if (this.selectedUser()?.id === user.id) this.selectedUser.set(full);
      },
      error: () => {},
    });
  }

  closeDetail(): void {
    this.selectedUser.set(null);
    this.closeRolePicker();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: list => {
        this.allUsers.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load users.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.closeRolePicker();
  }

  async toggleActive(user: AdminUser, event?: Event): Promise<void> {
    if (user.isActive) {
      const confirmed = await this.confirmService.confirm({
        title: 'Deactivate user',
        message: `"${user.fullName}" will no longer be able to sign in until reactivated.`,
        confirmLabel: 'Deactivate',
        danger: true,
      });
      if (!confirmed) {
        // Revert the natively-toggled checkbox back to the actual state.
        const input = event?.target as HTMLInputElement | undefined;
        if (input) input.checked = user.isActive;
        return;
      }
    }
    this.actingId.set(user.id);
    this.adminService
      .setUserActive(user.id, { isActive: !user.isActive })
      .pipe(finalize(() => this.actingId.set(null)))
      .subscribe({
        next: () => {
          const updated = { ...user, isActive: !user.isActive };
          this.allUsers.update(list => list.map(u => (u.id === user.id ? updated : u)));
          if (this.selectedUser()?.id === user.id) this.selectedUser.set(updated);
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
          const updated = { ...user, roles: [role] };
          this.allUsers.update(list => list.map(u => (u.id === user.id ? updated : u)));
          if (this.selectedUser()?.id === user.id) this.selectedUser.set(updated);
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

  async deleteUser(user: AdminUser): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete user',
      message: `Permanently delete "${user.fullName}"? This cannot be undone.`,
      confirmLabel: 'Delete user',
      danger: true,
    });
    if (!confirmed) return;
    this.deletingId.set(user.id);
    this.adminService
      .deleteUser(user.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.allUsers.update(list => list.filter(u => u.id !== user.id));
          if (this.selectedUser()?.id === user.id) this.closeDetail();
          this.toast.show('Deleted', `"${user.fullName}" has been deleted.`, 'success');
        },
        error: err => this.toast.show('Cannot Delete', err.error?.message ?? 'Delete failed.', 'error'),
      });
  }
}
