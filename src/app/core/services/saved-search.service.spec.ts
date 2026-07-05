import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SavedSearchService } from './saved-search.service';
import { environment } from '../../../environments/environment';

const base = `${environment.apiUrl}/api/saved-searches`;

describe('SavedSearchService', () => {
  let service: SavedSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create posts the criteria and unwraps the created search', () => {
    let created: unknown;
    service.create({ searchTerm: 'drill', maxPrice: 50 }).subscribe(s => (created = s));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ searchTerm: 'drill', maxPrice: 50 });
    req.flush({ succeeded: true, message: '', data: { id: 1, searchTerm: 'drill' }, errors: [] });

    expect(created).toEqual({ id: 1, searchTerm: 'drill' });
  });

  it('create errors when the API returns no data', () => {
    let error: Error | undefined;
    service.create({ searchTerm: 'drill' }).subscribe({ error: e => (error = e) });

    http.expectOne(base).flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(error?.message).toContain('No saved search');
  });

  it('getAll defaults to an empty list', () => {
    let items: unknown[] = [{ marker: true }];
    service.getAll().subscribe(s => (items = s));

    http.expectOne(base).flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(items).toEqual([]);
  });

  it('delete targets the specific search', () => {
    service.delete(12).subscribe();

    const req = http.expectOne(`${base}/12`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ succeeded: true, message: '', data: null, errors: [] });
  });
});
