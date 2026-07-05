import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool, ToolImage, UpdateToolRequest } from '../../../core/models/tool.model';
import { ToolFormComponent, ToolFormSubmitPayload } from '../tool-form/tool-form.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-edit-tool',
  imports: [ToolFormComponent, LoadingSpinnerComponent],
  templateUrl: './edit-tool.component.html',
})
export class EditToolComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toolsService = inject(ToolsService);

  protected readonly tool = signal<Tool | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid tool id.');
      this.isLoading.set(false);
      return;
    }

    this.toolsService.getById(id).subscribe({
      next: tool => {
        this.tool.set(tool);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load tool.');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(payload: ToolFormSubmitPayload): void {
    const tool = this.tool();
    if (!tool) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    const updateRequest: UpdateToolRequest = { ...payload.request };

    this.toolsService
      .update(tool.id, updateRequest)
      .pipe(
        switchMap(updated => {
          if (payload.imageFiles.length) {
            return this.toolsService
              .uploadImages(updated.id, payload.imageFiles)
              .pipe(switchMap(() => of(updated)));
          }
          return of(updated);
        })
      )
      .subscribe({
        next: updated => {
          this.isSubmitting.set(false);
          this.router.navigate(['/tools', updated.id]);
        },
        error: err => {
          this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to update tool.');
          this.isSubmitting.set(false);
        },
      });
  }

  onImagesChanged(images: ToolImage[]): void {
    this.tool.update(tool =>
      tool
        ? { ...tool, images: [...images], imageUrls: images.map(i => i.imageUrl) }
        : tool
    );
  }

  onCancel(): void {
    const tool = this.tool();
    if (tool) {
      this.router.navigate(['/tools', tool.id]);
    } else {
      this.router.navigate(['/tools']);
    }
  }
}
