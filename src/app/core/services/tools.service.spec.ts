import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ToolsService } from './tools.service';
import { environment } from '../../../environments/environment';

const base = `${environment.apiUrl}/api/Tools`;

const envelope = <T>(data: T) => ({ succeeded: true, message: '', data, errors: [] });

describe('ToolsService', () => {
  let service: ToolsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ToolsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll maps filter params to the backend query-string names', () => {
    service
      .getAll({
        categoryId: 3,
        location: 'Cairo',
        minPrice: 5,
        maxPrice: 50,
        isAvailable: true,
        searchTerm: 'drill',
        page: 2,
        pageSize: 12,
      })
      .subscribe();

    const req = http.expectOne(r => r.url === base);
    const p = req.request.params;
    expect(p.get('CategoryId')).toBe('3');
    expect(p.get('Location')).toBe('Cairo');
    expect(p.get('MinPrice')).toBe('5');
    expect(p.get('MaxPrice')).toBe('50');
    expect(p.get('IsAvailable')).toBe('true');
    expect(p.get('SearchTerm')).toBe('drill');
    expect(p.get('Page')).toBe('2');
    expect(p.get('PageSize')).toBe('12');
    req.flush(envelope({ items: [], totalCount: 0, pageNumber: 2, pageSize: 12 }));
  });

  it('getAll omits geo params unless both coordinates are set', () => {
    service.getAll({ nearLat: 30.1 }).subscribe();

    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.has('NearLat')).toBe(false);
    expect(req.request.params.has('NearLng')).toBe(false);
    req.flush(envelope({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 }));
  });

  it('getAll sends radius only alongside both coordinates', () => {
    service.getAll({ nearLat: 30.1, nearLng: 31.2, radiusKm: 10 }).subscribe();

    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('NearLat')).toBe('30.1');
    expect(req.request.params.get('NearLng')).toBe('31.2');
    expect(req.request.params.get('RadiusKm')).toBe('10');
    req.flush(envelope({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 }));
  });

  it('uploadImages posts all files under the "images" field', () => {
    const a = new File(['a'], 'a.jpg');
    const b = new File(['b'], 'b.jpg');
    service.uploadImages(7, [a, b]).subscribe();

    const req = http.expectOne(`${base}/7/images`);
    expect(req.request.method).toBe('POST');
    const form = req.request.body as FormData;
    expect(form.getAll('images')).toEqual([a, b]);
    req.flush(envelope({ toolId: 7, imageUrls: [] }));
  });

  it('delete issues DELETE to the tool endpoint', () => {
    service.delete(9).subscribe();
    const req = http.expectOne(`${base}/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('setPrimaryImage PUTs to the image primary endpoint', () => {
    service.setPrimaryImage(4).subscribe();
    const req = http.expectOne(`${base}/images/4/primary`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
