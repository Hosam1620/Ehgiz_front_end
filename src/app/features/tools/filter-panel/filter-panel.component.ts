import { Component, OnInit, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoryOption } from '../../../core/models/tool.model';
import { BrowseFilterStore } from '../browse-filter.store';
import { BrowseService } from '../browse.service';

const CONDITION_OPTIONS = ['New', 'Good', 'Fair', 'Poor'] as const;

@Component({
  selector: 'app-filter-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly filterStore = inject(BrowseFilterStore);
  private readonly browseService = inject(BrowseService);

  readonly filtersChanged = output<void>();

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly conditionOptions = CONDITION_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    searchTerm: [''],
    categoryId: [''],
    location: [''],
    minPrice: [''],
    maxPrice: [''],
    availableOnly: [true],
    includeUnavailable: [false],
    insuredOnly: [false],
    conditions: this.fb.nonNullable.group({
      New: [false],
      Good: [true],
      Fair: [false],
      Poor: [false],
    }),
  });

  constructor() {
    // Keep the category select in sync when chips in browse page update the store
    effect(() => {
      const catId = this.filterStore.categoryId();
      const newValue = catId != null ? String(catId) : '';
      if (this.form.controls.categoryId.value !== newValue) {
        this.form.controls.categoryId.setValue(newValue, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.syncFormFromStore();
    this.loadCategories();

    this.form.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.applyFormToStore();
      this.filtersChanged.emit();
    });
  }

  reset(): void {
    this.filterStore.reset();
    this.syncFormFromStore();
    this.filtersChanged.emit();
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
        conditions: {
          New: s.conditions.includes('New'),
          Good: s.conditions.includes('Good'),
          Fair: s.conditions.includes('Fair'),
          Poor: s.conditions.includes('Poor'),
        },
      },
      { emitEvent: false }
    );

    CONDITION_OPTIONS.forEach(option => {
      if (!s.conditions.length && option === 'Good') {
        this.form.controls.conditions.controls[option].setValue(true, { emitEvent: false });
      }
    });
  }

  private applyFormToStore(): void {
    const value = this.form.getRawValue();
    const selectedConditions = CONDITION_OPTIONS.filter(option => value.conditions[option]);

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
      conditions: selectedConditions,
      page: 1,
    });
  }
}
