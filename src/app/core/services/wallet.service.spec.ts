import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';

const base = `${environment.apiUrl}/api/wallet`;

describe('WalletService', () => {
  let service: WalletService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WalletService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getWallet unwraps the ApiResponse payload', () => {
    let wallet: unknown;
    service.getWallet().subscribe(w => (wallet = w));

    http.expectOne(base).flush({
      succeeded: true,
      message: '',
      data: { id: 1, balance: 70, heldBalance: 30, totalBalance: 100 },
      errors: [],
    });

    expect(wallet).toEqual({ id: 1, balance: 70, heldBalance: 30, totalBalance: 100 });
  });

  it('getWallet errors when the payload is empty', () => {
    let error: Error | undefined;
    service.getWallet().subscribe({ error: e => (error = e) });

    http.expectOne(base).flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(error?.message).toContain('No wallet data');
  });

  it('getTransactions falls back to an empty list', () => {
    let txs: unknown[] = [{ marker: true }];
    service.getTransactions().subscribe(t => (txs = t));

    http.expectOne(`${base}/transactions`)
      .flush({ succeeded: true, message: '', data: null, errors: [] });

    expect(txs).toEqual([]);
  });

  it('initiateTopUp posts the amount and unwraps the client secret', () => {
    let secret = '';
    service.initiateTopUp({ amount: 50, currency: 'usd' }).subscribe(r => (secret = r.clientSecret));

    const req = http.expectOne(`${base}/topup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 50, currency: 'usd' });
    req.flush({
      succeeded: true,
      message: '',
      data: { clientSecret: 'cs_123', amount: 50, currency: 'usd' },
      errors: [],
    });

    expect(secret).toBe('cs_123');
  });

  it('getEarnings passes the months param', () => {
    service.getEarnings(6).subscribe();

    const req = http.expectOne(r => r.url === `${base}/earnings`);
    expect(req.request.params.get('months')).toBe('6');
    req.flush({ succeeded: true, message: '', data: [], errors: [] });
  });

  it('withdraw posts to the withdraw endpoint', () => {
    service.withdraw({ amount: 25 }).subscribe();

    const req = http.expectOne(`${base}/withdraw`);
    expect(req.request.body).toEqual({ amount: 25 });
    req.flush({ succeeded: true, message: '', data: null, errors: [] });
  });
});
