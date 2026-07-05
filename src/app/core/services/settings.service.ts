import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PlatformFeeResponse } from '../models/admin.model';

/** Public platform settings (no auth required). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  private feePercent$?: Observable<number>;

  /** GET /api/settings/platform-fee (cached for the session). */
  getPlatformFeePercent(): Observable<number> {
    this.feePercent$ ??= this.http
      .get<ApiResponse<PlatformFeeResponse>>(`${environment.apiUrl}/api/settings/platform-fee`)
      .pipe(
        map(r => r.data?.feePercent ?? 0),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    return this.feePercent$;
  }
}
