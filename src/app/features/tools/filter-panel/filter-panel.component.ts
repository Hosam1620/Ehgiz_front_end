import { Component, DestroyRef, OnInit, effect, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoryOption, TOOL_CONDITIONS, ToolCondition } from '../../../core/models/tool.model';
import { CreateSavedSearchRequest } from '../../../core/models/saved-search.model';
import { SavedSearchService } from '../../../core/services/saved-search.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { BrowseFilterStore } from '../browse-filter.store';
import { BrowseService } from '../browse.service';

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

@Component({
  selector: 'app-filter-panel',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly filterStore = inject(BrowseFilterStore);
  private readonly browseService = inject(BrowseService);
  private readonly savedSearchService = inject(SavedSearchService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly auth = inject(AuthService);

  readonly filtersChanged = output<void>();

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly conditionOptions = TOOL_CONDITIONS;
  protected readonly activeFilterCount = signal(0);
  protected readonly radiusOptions = RADIUS_OPTIONS;
  protected readonly nearMeActive = this.filterStore.nearMeActive;
  protected readonly locating = signal(false);
  protected readonly geoError = signal<string | null>(null);
  protected readonly selectedRadius = signal<number>(10);
  protected readonly isSavingSearch = signal(false);

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
    this.geoError.set(null);
    this.selectedRadius.set(10);
    this.syncFormFromStore();
    this.updateActiveCount();
    this.filtersChanged.emit();
  }

  protected toggleNearMe(): void {
    if (this.nearMeActive()) {
      this.filterStore.patch({ nearLat: null, nearLng: null, radiusKm: null, page: 1 });
      this.updateActiveCount();
      this.filtersChanged.emit();
      return;
    }

    if (!('geolocation' in navigator)) {
      this.geoError.set('Location is not supported by this browser.');
      return;
    }

    this.locating.set(true);
    this.geoError.set(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        this.locating.set(false);
        this.filterStore.patch({
          nearLat: position.coords.latitude,
          nearLng: position.coords.longitude,
          radiusKm: this.selectedRadius(),
          page: 1,
        });
        this.updateActiveCount();
        this.filtersChanged.emit();
      },
      () => {
        this.locating.set(false);
        this.geoError.set('Could not get your location. Check browser permissions.');
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }

  protected onRadiusChange(event: Event): void {
    const radius = Number((event.target as HTMLSelectElement).value);
    this.selectedRadius.set(radius);
    if (this.nearMeActive()) {
      this.filterStore.patch({ radiusKm: radius, page: 1 });
      this.filtersChanged.emit();
    }
  }

  protected saveCurrentSearch(): void {
    const s = this.filterStore.snapshot();
    const request: CreateSavedSearchRequest = {
      searchTerm: s.searchTerm || undefined,
      categoryId: s.categoryId ?? undefined,
      location: s.location || undefined,
      minPrice: s.minPrice ?? undefined,
      maxPrice: s.maxPrice ?? undefined,
      condition: s.condition ?? undefined,
    };

    if (!Object.values(request).some(v => v !== undefined)) {
      this.toast.show('Nothing to save', 'Set at least one filter first.', 'warning');
      return;
    }

    this.isSavingSearch.set(true);
    this.savedSearchService
      .create(request)
      .pipe(finalize(() => this.isSavingSearch.set(false)))
      .subscribe({
        next: () => this.toast.show(
          'Search saved',
          "We'll notify you when a new tool matches.",
          'success'
        ),
        error: err => this.toast.show('Error', err.error?.message ?? 'Could not save search.', 'error'),
      });
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
    if (this.nearMeActive()) count++;
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
