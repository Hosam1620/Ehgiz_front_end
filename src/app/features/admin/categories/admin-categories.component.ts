import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminCategory } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);

  protected readonly showCreateForm = signal(false);
  protected readonly createName = signal('');
  protected readonly createDescription = signal('');

  protected readonly editId = signal<number | null>(null);
  protected readonly editName = signal('');
  protected readonly editDescription = signal('');

  protected readonly deleteConfirmId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.getAdminCategories().subscribe({
      next: list => {
        this.categories.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        this.toast.show('Error', err.error?.message ?? 'Failed to load categories.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  openCreate(): void {
    this.showCreateForm.set(true);
    this.createName.set('');
    this.createDescription.set('');
    this.editId.set(null);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
  }

  submitCreate(): void {
    const name = this.createName().trim();
    if (!name) {
      this.toast.show('Validation', 'Name is required.', 'warning');
      return;
    }
    this.isSaving.set(true);
    this.adminService
      .createCategory({ name, description: this.createDescription().trim() || undefined })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: res => {
          if (res.data) {
            this.categories.update(list => [...list, res.data!]);
          } else {
            this.load();
          }
          this.toast.show('Created', `Category "${name}" added.`, 'success');
          this.showCreateForm.set(false);
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Create failed.', 'error'),
      });
  }

  startEdit(cat: AdminCategory): void {
    this.editId.set(cat.id);
    this.editName.set(cat.name);
    this.editDescription.set(cat.description ?? '');
    this.showCreateForm.set(false);
  }

  cancelEdit(): void {
    this.editId.set(null);
  }

  submitEdit(): void {
    const id = this.editId();
    if (id === null) return;
    const name = this.editName().trim();
    if (!name) {
      this.toast.show('Validation', 'Name is required.', 'warning');
      return;
    }
    this.isSaving.set(true);
    this.adminService
      .updateCategory(id, { name, description: this.editDescription().trim() || undefined })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.categories.update(list =>
            list.map(c =>
              c.id === id
                ? { ...c, name, description: this.editDescription().trim() || null }
                : c
            )
          );
          this.toast.show('Updated', `Category updated.`, 'success');
          this.editId.set(null);
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Update failed.', 'error'),
      });
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  doDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.deleteConfirmId.set(null);
    this.isSaving.set(true);
    this.adminService
      .deleteCategory(id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.categories.update(list => list.filter(c => c.id !== id));
          this.toast.show('Deleted', 'Category removed.', 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Delete failed — category may have tools assigned.', 'error'),
      });
  }
}
