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

    const createRequest = {
      categoryId: payload.request.categoryId,
      name: payload.request.name,
      description: payload.request.description,
      pricePerDay: payload.request.pricePerDay,
      insurancePrice: payload.request.insurancePrice,
      condition: payload.request.condition,
      location: payload.request.location,
    };

    this.toolsService
      .create(createRequest)
      .pipe(
        switchMap(tool => {
          if (payload.imageFiles.length) {
            return this.toolsService.uploadImages(tool.id, payload.imageFiles).pipe(switchMap(() => of(tool)));
          }
          return of(tool);
        })
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/tools']);
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
