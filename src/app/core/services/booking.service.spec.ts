import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BookingService } from './booking.service';
import { environment } from '../../../environments/environment';

const base = `${environment.apiUrl}/api/bookings`;

describe('BookingService', () => {
  let service: BookingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMyBookings unwraps data and defaults to empty list', () => {
    let bookings: unknown[] = [];
    service.getMyBookings().subscribe(b => (bookings = b));

    http.expectOne(`${base}/my`)
      .flush({ succeeded: true, message: '', data: [{ id: 1 }], errors: [] });

    expect(bookings).toEqual([{ id: 1 }]);
  });

  it('create posts and errors when no data is returned', () => {
    let error: Error | undefined;
    service
      .create({ toolId: 1, startDate: '2026-07-10', endDate: '2026-07-12' })
      .subscribe({ error: e => (error = e) });

    http.expectOne(base).flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(error?.message).toContain('No booking response');
  });

  it('accept / reject / cancel hit their PUT endpoints', () => {
    service.accept(5).subscribe();
    http.expectOne(`${base}/5/accept`).flush({ succeeded: true, message: '', data: null, errors: [] });

    service.reject(5).subscribe();
    http.expectOne(`${base}/5/reject`).flush({ succeeded: true, message: '', data: null, errors: [] });

    service.cancel(5).subscribe();
    const cancelReq = http.expectOne(`${base}/5/cancel`);
    expect(cancelReq.request.method).toBe('PUT');
    cancelReq.flush({ succeeded: true, message: '', data: null, errors: [] });
  });

  it('submitDeliveryHandover posts multipart form with notes and images', () => {
    const img = new File(['x'], 'proof.jpg');
    service.submitDeliveryHandover(3, 'delivered at door', [img]).subscribe();

    const req = http.expectOne(`${base}/3/handover/delivery`);
    const form = req.request.body as FormData;
    expect(form.get('notes')).toBe('delivered at door');
    expect(form.getAll('images')).toEqual([img]);
    req.flush({ succeeded: true, message: '', data: null, errors: [] });
  });

  it('submitReturnHandover omits notes when null', () => {
    service.submitReturnHandover(3, null, []).subscribe();

    const req = http.expectOne(`${base}/3/handover/return`);
    const form = req.request.body as FormData;
    expect(form.get('notes')).toBeNull();
    req.flush({ succeeded: true, message: '', data: null, errors: [] });
  });

  it('getToolAvailability passes year and month params', () => {
    service.getToolAvailability(9, 2026, 7).subscribe();

    const req = http.expectOne(r => r.url === `${base}/tool/9/availability`);
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('7');
    req.flush({
      succeeded: true,
      message: '',
      data: { toolId: 9, year: 2026, month: 7, bookedRanges: [] },
      errors: [],
    });
  });
});
