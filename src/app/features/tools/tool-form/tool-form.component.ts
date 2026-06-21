import { Component, OnInit, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryOption, CreateToolRequest, Tool, UpdateToolRequest } from '../../../core/models/tool.model';
import { BrowseService } from '../browse.service';

const CONDITION_OPTIONS = ['New', 'Good', 'Fair', 'Poor'] as const;

export interface ToolFormSubmitPayload {
  request: CreateToolRequest;
  imageFiles: File[];
}

@Component({
  selector: 'app-tool-form',
  imports: [ReactiveFormsModule],
  templateUrl: './tool-form.component.html',
})
export class ToolFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly browseService = inject(BrowseService);

  tool = input<Tool | null>(null);
  isSubmitting = input<boolean>(false);
  submitLabel = input<string>('Save & publish');

  submitted = output<ToolFormSubmitPayload>();
  cancelled = output<void>();

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly conditionOptions = CONDITION_OPTIONS;
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly existingImages = signal<string[]>([]);
  protected readonly previewUrls = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    pricePerDay: [0, [Validators.required, Validators.min(1)]],
    insurancePrice: [0, [Validators.min(0)]],
    condition: ['Good', Validators.required],
    location: ['', Validators.required],
    isAvailable: [true],
  });

  constructor() {
    effect(() => {
      const tool = this.tool();
      if (tool) {
        this.patchForm(tool);
      }
    });
  }

  ngOnInit(): void {
    this.browseService.loadCategoryOptions().subscribe({
      next: categories => this.categories.set(categories),
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.selectedFiles.update(current => [...current, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.update(urls => [...urls, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeNewImage(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateToolRequest = {
      name: value.name.trim(),
      categoryId: Number(value.categoryId),
      description: value.description.trim(),
      pricePerDay: Number(value.pricePerDay),
      insurancePrice: Number(value.insurancePrice) || 0,
      condition: value.condition,
      location: value.location.trim(),
      isAvailable: value.isAvailable,
    };

    this.submitted.emit({
      request,
      imageFiles: this.selectedFiles(),
    });
  }

  private patchForm(tool: Tool): void {
    this.form.patchValue({
      name: tool.name ?? '',
      categoryId: String(tool.categoryId),
      description: tool.description ?? '',
      pricePerDay: tool.pricePerDay,
      insurancePrice: tool.insurancePrice,
      condition: tool.condition ?? 'Good',
      location: tool.location ?? '',
      isAvailable: tool.isAvailable,
    });
    this.existingImages.set(tool.imageUrls ?? []);
  }
}
