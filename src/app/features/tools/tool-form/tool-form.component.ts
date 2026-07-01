import { Component, OnInit, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, startWith, debounceTime, catchError, of } from 'rxjs';
import { AiSuggestionBoxComponent } from './ai-suggestion-box/ai-suggestion-box.component';
import { ClassificationService, ApiResponse, ClassifyResponseDto } from '../classification.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CategoryOption,
  Tool,
  ToolCondition,
  ToolConditionValue,
  UpdateToolRequest,
} from '../../../core/models/tool.model';
import { BrowseService } from '../browse.service';

const CONDITION_OPTIONS: { label: ToolCondition; value: ToolConditionValue }[] = [
  { label: 'New', value: 1 },
  { label: 'Good', value: 2 },
  { label: 'Fair', value: 3 },
  { label: 'Poor', value: 4 },
];

export interface ToolFormSubmitPayload {
  request: UpdateToolRequest;
  imageFiles: File[];
}

@Component({
  selector: 'app-tool-form',
  imports: [ReactiveFormsModule, AiSuggestionBoxComponent],
  templateUrl: './tool-form.component.html',
})
export class ToolFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly browseService = inject(BrowseService);
  private readonly classificationService = inject(ClassificationService);

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
  protected readonly fileError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    categoryId: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    pricePerDay: [0, [Validators.required, Validators.min(1)]],
    insurancePrice: [0, [Validators.min(0)]],
    condition: ['2', Validators.required],
    location: ['', Validators.required],
    isAvailable: [true],
  });

  isClassifying = signal(false);
  suggestedCategoryName = signal<string | null>(null);
  aiSuggestionDismissed = signal(false);
  userManuallyChangedCategory = signal(false);
  lastClassifiedText = signal('');

  constructor() {
    effect(() => {
      const tool = this.tool();
      if (tool) {
        this.patchForm(tool);
        if (tool.categoryId) {
          this.userManuallyChangedCategory.set(true);
        }
      }
    });

    this.form.controls.categoryId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.userManuallyChangedCategory.set(true);
      this.suggestedCategoryName.set(null);
    });

    combineLatest([
      this.form.controls.name.valueChanges.pipe(startWith(this.form.getRawValue().name)),
      this.form.controls.description.valueChanges.pipe(startWith(this.form.getRawValue().description))
    ])
      .pipe(
        debounceTime(700),
        takeUntilDestroyed()
      )
      .subscribe(([name, desc]) => {
        const n = name ?? '';
        const d = desc ?? '';
        
        if (n.length >= 3 && d.length >= 20) {
          const currentText = `${n}|${d}`;
          const last = this.lastClassifiedText();
          const isSignificant = Math.abs(currentText.length - last.length) > 5 || last === '';
          
          if (!this.userManuallyChangedCategory() || isSignificant) {
            this.lastClassifiedText.set(currentText);
            this.userManuallyChangedCategory.set(false);
            this.aiSuggestionDismissed.set(false);
            this.isClassifying.set(true);
            this.suggestedCategoryName.set(null);

            this.classificationService.classify(n, d).pipe(
              catchError(() => of(null as ApiResponse<ClassifyResponseDto> | null))
            ).subscribe((res: ApiResponse<ClassifyResponseDto> | null) => {
              this.isClassifying.set(false);
              if (res?.succeeded && res.data?.category && !this.aiSuggestionDismissed()) {
                this.suggestedCategoryName.set(res.data.category);
              }
            });
          }
        } else {
          this.isClassifying.set(false);
          this.suggestedCategoryName.set(null);
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

  acceptAiSuggestion(): void {
    const suggestedName = this.suggestedCategoryName();
    if (!suggestedName) return;

    const category = this.categories().find(c => c.name.toLowerCase() === suggestedName.toLowerCase());
    if (category) {
      this.form.controls.categoryId.setValue(String(category.id), { emitEvent: false });
    }
    this.suggestedCategoryName.set(null);
  }

  dismissAiSuggestion(): void {
    this.aiSuggestionDismissed.set(true);
    this.suggestedCategoryName.set(null);
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
    this.existingImages.set(tool.imageUrls ?? []);
  }

  private toConditionValue(condition: string | null): ToolConditionValue {
    const numericValue = Number(condition);
    if ([1, 2, 3, 4].includes(numericValue)) {
      return numericValue as ToolConditionValue;
    }

    const normalizedCondition = condition?.toLowerCase();
    const match = CONDITION_OPTIONS.find(option => option.label.toLowerCase() === normalizedCondition);
    return match?.value ?? 2;
  }
}
