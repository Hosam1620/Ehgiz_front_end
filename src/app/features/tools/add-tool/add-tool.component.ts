import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToolsService } from '../../../core/services/tools.service';
import { ToolFormComponent, ToolFormSubmitPayload } from '../tool-form/tool-form.component';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-add-tool',
  imports: [ToolFormComponent],
  templateUrl: './add-tool.component.html',
})
export class AddToolComponent {
  private readonly toolsService = inject(ToolsService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  onSubmit(payload: ToolFormSubmitPayload): void {
    this.isSubmitting.set(true);
    this.error.set(null);

    this.toolsService
      .create(payload.request)
      .pipe(
        switchMap(tool => {
          if (payload.imageFiles.length) {
            return this.toolsService.uploadImages(tool.id, payload.imageFiles).pipe(switchMap(() => of(tool)));
          }
          return of(tool);
        })
      )
      .subscribe({
        next: tool => {
          this.isSubmitting.set(false);
          this.router.navigate(['/tools', tool.id]);
        },
        error: err => {
          this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to create tool.');
          this.isSubmitting.set(false);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/tools']);
  }
}
