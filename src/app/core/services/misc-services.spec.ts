import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { SettingsService } from './settings.service';
import { ReviewService } from './review.service';
import { ThemeService } from './theme.service';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps categories to id/name options and caches the request', () => {
    let first: unknown;
    service.getCategories().subscribe(c => (first = c));

    http.expectOne(`${api}/api/categories`).flush({
      succeeded: true,
      message: '',
      data: [{ id: 1, name: 'Power Tools', description: 'x', toolCount: 3 }],
      errors: [],
    });

    expect(first).toEqual([{ id: 1, name: 'Power Tools' }]);

    // Second subscription must be served from the shareReplay cache.
    let second: unknown;
    service.getCategories().subscribe(c => (second = c));
    http.expectNone(`${api}/api/categories`);
    expect(second).toEqual(first);
  });
});

describe('SettingsService', () => {
  let service: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('returns the platform fee percent and defaults to 0', () => {
    let fee = -1;
    service.getPlatformFeePercent().subscribe(f => (fee = f));

    http.expectOne(`${api}/api/settings/platform-fee`)
      .flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(fee).toBe(0);
  });
});

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getByTool unwraps the list', () => {
    let reviews: unknown[] = [];
    service.getByTool(7).subscribe(r => (reviews = r));

    http.expectOne(`${api}/api/reviews/tool/7`)
      .flush({ succeeded: true, message: '', data: [{ id: 1, rating: 5 }], errors: [] });

    expect(reviews).toEqual([{ id: 1, rating: 5 }]);
  });

  it('create errors when no review is returned', () => {
    let error: Error | undefined;
    service.create({ bookingId: 1, rating: 5 }).subscribe({ error: e => (error = e) });

    http.expectOne(`${api}/api/reviews`)
      .flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(error?.message).toContain('No review data');
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('honors the stored theme', () => {
    localStorage.setItem('ehgiz_theme', 'dark');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('toggle flips the theme and stamps <html data-theme>', async () => {
    localStorage.setItem('ehgiz_theme', 'light');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    TestBed.tick(); // run the persistence effect

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('ehgiz_theme')).toBe('dark');
  });
});
