import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CategoryOption,
  TOOL_CONDITIONS,
  Tool,
  ToolConditionValue,
  ToolImage,
  UpdateToolRequest,
} from '../../../core/models/tool.model';
import { BrowseService } from '../browse.service';
import { ToolsService } from '../../../core/services/tools.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { resolveMediaUrl } from '../../../core/utils/media-url';
import { HttpErrorResponse } from '@angular/common/http';

export interface ToolFormSubmitPayload {
  request: UpdateToolRequest;
  imageFiles: File[];
}

@Component({
  selector: 'app-tool-form',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './tool-form.component.html',
})
export class ToolFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly browseService = inject(BrowseService);
  private readonly toolsService = inject(ToolsService);
  private readonly settingsService = inject(SettingsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  tool = input<Tool | null>(null);
  isSubmitting = input<boolean>(false);
  submitLabel = input<string>('Save & publish');

  submitted = output<ToolFormSubmitPayload>();
  cancelled = output<void>();
  /** Emitted whenever the server-side image list changes (delete / set primary). */
  imagesChanged = output<ToolImage[]>();

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly conditionOptions = TOOL_CONDITIONS;
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly existingImages = signal<ToolImage[]>([]);
  protected readonly previewUrls = signal<string[]>([]);
  protected readonly fileError = signal<string | null>(null);
  protected readonly isAnalyzing = signal(false);
  protected readonly suggestionError = signal<string | null>(null);
  protected readonly suggestionSuccess = signal<string | null>(null);
  protected readonly imageActionId = signal<number | null>(null);

  // Optional map pin (sent as latitude/longitude, always together)
  protected readonly pinnedLat = signal<number | null>(null);
  protected readonly pinnedLng = signal<number | null>(null);
  protected readonly isPinning = signal(false);
  protected readonly pinError = signal<string | null>(null);

  // Platform commission banner
  protected readonly feePercent = signal<number | null>(null);
  private readonly priceValue = signal(0);
  protected readonly feeAmount = computed(() => {
    const fee = this.feePercent();
    const price = this.priceValue();
    if (fee === null || !price || price <= 0) return null;
    return (price * fee) / 100;
  });
  protected readonly priceAfterFee = computed(() => {
    const amount = this.feeAmount();
    return amount === null ? null : this.priceValue() - amount;
  });

  protected readonly resolveMediaUrl = resolveMediaUrl;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    pricePerDay: [0, [Validators.required, Validators.min(1)]],
    insurancePrice: [0, [Validators.min(0)]],
    condition: ['3', Validators.required],
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

    this.form.controls.pricePerDay.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.priceValue.set(Number(value) || 0));
  }

  ngOnInit(): void {
    this.browseService.loadCategoryOptions().subscribe({
      next: categories => this.categories.set(categories),
    });
    this.settingsService.getPlatformFeePercent().subscribe({
      next: fee => this.feePercent.set(fee),
      error: () => {},
    });
  }

  protected useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.pinError.set('Location is not supported by this browser.');
      return;
    }

    this.isPinning.set(true);
    this.pinError.set(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        this.isPinning.set(false);
        this.pinnedLat.set(position.coords.latitude);
        this.pinnedLng.set(position.coords.longitude);
      },
      () => {
        this.isPinning.set(false);
        this.pinError.set('Could not get your location. Check browser permissions.');
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }

  protected clearPin(): void {
    this.pinnedLat.set(null);
    this.pinnedLng.set(null);
    this.pinError.set(null);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = Array.from(input.files ?? []);
    this.fileError.set(null);

    const invalid = raw.filter(f => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024);
    if (invalid.length) {
      this.fileError.set('Some files were skipped: only images up to 5 MB are allowed.');
    }
    const files = raw.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (!files.length) { input.value = ''; return; }

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

  async deleteExistingImage(image: ToolImage): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete photo',
      message: 'This photo will be permanently removed from the listing.',
      confirmLabel: 'Delete photo',
      danger: true,
    });
    if (!confirmed) return;

    this.imageActionId.set(image.id);
    this.toolsService.deleteImage(image.id).subscribe({
      next: () => {
        this.existingImages.update(list => list.filter(i => i.id !== image.id));
        this.imageActionId.set(null);
        this.imagesChanged.emit(this.existingImages());
        this.toast.show('Deleted', 'Photo removed from listing.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.imageActionId.set(null);
        this.toast.show('Error', err.error?.message ?? 'Could not delete photo.', 'error');
      },
    });
  }

  setPrimaryImage(image: ToolImage): void {
    if (image.isPrimary || this.imageActionId() !== null) return;

    this.imageActionId.set(image.id);
    this.toolsService.setPrimaryImage(image.id).subscribe({
      next: () => {
        this.existingImages.update(list => {
          const updated = list.map(i => ({ ...i, isPrimary: i.id === image.id }));
          // Keep the API ordering contract: primary first.
          return [...updated.filter(i => i.isPrimary), ...updated.filter(i => !i.isPrimary)];
        });
        this.imageActionId.set(null);
        this.imagesChanged.emit(this.existingImages());
        this.toast.show('Updated', 'Primary photo changed.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.imageActionId.set(null);
        this.toast.show('Error', err.error?.message ?? 'Could not set primary photo.', 'error');
      },
    });
  }

  onAnalyzeImages(): void {
    const files = this.selectedFiles();
    if (!files.length || this.isAnalyzing()) {
      return;
    }

    this.isAnalyzing.set(true);
    this.suggestionError.set(null);
    this.suggestionSuccess.set(null);

    this.toolsService.suggestFromImages(files).subscribe({
      next: suggestion => {
        this.form.patchValue({
          name: suggestion.name,
          description: suggestion.description,
          condition: String(suggestion.condition),
          categoryId: String(suggestion.categoryId),
        });
        this.form.controls.name.markAsTouched();
        this.form.controls.description.markAsTouched();
        this.form.controls.categoryId.markAsTouched();
        this.form.controls.condition.markAsTouched();
        this.suggestionSuccess.set(
          suggestion.categoryName
            ? `Suggestions applied (${suggestion.categoryName}). Review and adjust before publishing.`
            : 'Suggestions applied. Review and adjust before publishing.'
        );
        this.isAnalyzing.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.suggestionError.set(
          err.error?.message ?? err.error?.title ?? 'Failed to analyze images. Please try again.'
        );
        this.isAnalyzing.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: UpdateToolRequest = {
      name: value.name.trim(),
      categoryId: Number(value.categoryId),
      description: value.description.trim(),
      pricePerDay: Number(value.pricePerDay),
      insurancePrice: Number(value.insurancePrice) || 0,
      condition: Number(value.condition) as ToolConditionValue,
      location: value.location.trim(),
      latitude: this.pinnedLat(),
      longitude: this.pinnedLng(),
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
      condition: String(this.toConditionValue(tool.condition)),
      location: tool.location ?? '',
      isAvailable: tool.isAvailable,
    });
    this.priceValue.set(tool.pricePerDay);
    this.pinnedLat.set(tool.latitude);
    this.pinnedLng.set(tool.longitude);
    this.existingImages.set(this.normalizeImages(tool));
  }

  /** Prefer the images collection (has ids for management); fall back to bare URLs. */
  private normalizeImages(tool: Tool): ToolImage[] {
    if (tool.images?.length) return [...tool.images];
    return (tool.imageUrls ?? []).map((url, index) => ({
      id: 0,
      imageUrl: url,
      isPrimary: index === 0,
    }));
  }

  protected canManageImage(image: ToolImage): boolean {
    return image.id > 0;
  }

  private toConditionValue(condition: string | null): ToolConditionValue {
    const numericValue = Number(condition);
    if ([1, 2, 3, 4, 5].includes(numericValue)) {
      return numericValue as ToolConditionValue;
    }

    const normalizedCondition = condition?.toLowerCase();
    const match = TOOL_CONDITIONS.find(
      option =>
        option.name.toLowerCase() === normalizedCondition ||
        option.label.toLowerCase() === normalizedCondition
    );
    return match?.value ?? 3;
  }
}
