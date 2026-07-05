import { Component, DestroyRef, OnInit, effect, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoryOption, TOOL_CONDITIONS, ToolCondition } from '../../../core/models/tool.model';
import { BrowseFilterStore } from '../browse-filter.store';
import { BrowseService } from '../browse.service';

@Component({
  selector: 'app-filter-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly filterStore = inject(BrowseFilterStore);
  private readonly browseService = inject(BrowseService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filtersChanged = output<void>();

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly conditionOptions = TOOL_CONDITIONS;
  protected readonly activeFilterCount = signal(0);

  protected readonly form = this.fb.nonNullable.group({
    searchTerm: [''],
    categoryId: [''],
    location: [''],
    minPrice: [''],
    maxPrice: [''],
    availableOnly: [true],
    includeUnavailable: [false],
    insuredOnly: [false],
    /** '' = All conditions (Condition param omitted). */
    condition: [''],
  });

  constructor() {
    effect(() => {
      const catId = this.filterStore.categoryId();
      const newValue = catId != null ? String(catId) : '';
      if (this.form.controls.categoryId.value !== newValue) {
        this.form.controls.categoryId.setValue(newValue, { emitEvent: false });
      }
    });

    // Keep the search box in sync when the navbar search patches the store.
    // Trim-compare so the user's in-progress typing (trailing space) isn't clobbered.
    effect(() => {
      const term = this.filterStore.searchTerm();
      if (this.form.controls.searchTerm.value.trim() !== term) {
        this.form.controls.searchTerm.setValue(term, { emitEvent: false });
        this.updateActiveCount();
      }
    });
  }

  ngOnInit(): void {
    this.syncFormFromStore();
    this.loadCategories();
    this.updateActiveCount();

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateActiveCount());

    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFormToStore();
        this.filtersChanged.emit();
      });
  }

  reset(): void {
    this.filterStore.reset();
    this.syncFormFromStore();
    this.updateActiveCount();
    this.filtersChanged.emit();
  }

  protected setAvailability(availableOnly: boolean): void {
    this.form.patchValue({
      availableOnly,
      includeUnavailable: !availableOnly,
    });
  }

  private updateActiveCount(): void {
    const v = this.form.getRawValue();
    let count = 0;
    if (v.searchTerm.trim()) count++;
    if (v.categoryId) count++;
    if (v.location.trim()) count++;
    if (v.minPrice || v.maxPrice) count++;
    if (!v.availableOnly) count++;
    if (v.insuredOnly) count++;
    if (v.condition) count++;
    this.activeFilterCount.set(count);
  }

  private loadCategories(): void {
    this.browseService.loadCategoryOptions().subscribe({
      next: categories => this.categories.set(categories),
    });
  }

  private syncFormFromStore(): void {
    const s = this.filterStore.snapshot();

    this.form.patchValue(
      {
        searchTerm: s.searchTerm,
        categoryId: s.categoryId != null ? String(s.categoryId) : '',
        location: s.location,
        minPrice: s.minPrice != null ? String(s.minPrice) : '',
        maxPrice: s.maxPrice != null ? String(s.maxPrice) : '',
        availableOnly: s.isAvailable === true,
        includeUnavailable: s.isAvailable === null,
        insuredOnly: s.insuredOnly,
        condition: s.condition ?? '',
      },
      { emitEvent: false }
    );
  }

  private applyFormToStore(): void {
    const value = this.form.getRawValue();

    let isAvailable: boolean | null = null;
    if (value.availableOnly && !value.includeUnavailable) {
      isAvailable = true;
    } else if (!value.availableOnly && value.includeUnavailable) {
      isAvailable = null;
    } else if (value.availableOnly) {
      isAvailable = true;
    }

    this.filterStore.patch({
      searchTerm: value.searchTerm.trim(),
      categoryId: value.categoryId ? Number(value.categoryId) : null,
      location: value.location.trim(),
      minPrice: value.minPrice ? Number(value.minPrice) : null,
      maxPrice: value.maxPrice ? Number(value.maxPrice) : null,
      isAvailable,
      insuredOnly: value.insuredOnly,
      condition: (value.condition || null) as ToolCondition | null,
      page: 1,
    });
  }
}
