import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { resolveMediaUrl } from '../../core/utils/media-url';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, AvatarComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly isSaving = signal(false);
  protected readonly isUploadingAvatar = signal(false);
  protected readonly avatarError = signal<string | null>(null);


  protected readonly resolveMediaUrl = resolveMediaUrl;

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
    address: [''],
    city: [''],
  });

  constructor() {
    const profile = this.auth.currentUser();
    if (profile) {
      this.patchForm(profile);
    }
  }

  private patchForm(profile: UserProfile): void {
    this.form.patchValue({
      fullName: profile.fullName ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      address: profile.address ?? '',
      city: profile.city ?? '',
    });
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isSaving.set(true);
    this.auth
      .updateMe({
        fullName: value.fullName.trim(),
        phoneNumber: value.phoneNumber.trim() || undefined,
        address: value.address.trim() || undefined,
        city: value.city.trim() || undefined,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: res => {
          if (res.data) this.patchForm(res.data);
          this.toast.show('Saved', 'Your profile has been updated.', 'success');
        },
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not update profile.', 'error'),
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.avatarError.set(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Only image files are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.avatarError.set('Image is too large (max 5 MB).');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.auth
      .uploadProfileImage(file)
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: () => this.toast.show('Updated', 'Profile photo updated.', 'success'),
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not upload photo.', 'error'),
      });
  }



  removeAvatar(): void {
    this.isUploadingAvatar.set(true);
    this.auth
      .deleteProfileImage()
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: () => this.toast.show('Removed', 'Profile photo removed.', 'success'),
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not remove photo.', 'error'),
      });
  }
}
