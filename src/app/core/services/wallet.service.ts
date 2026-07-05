import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ConnectOnboardingResponse,
  MonthlyEarnings,
  TopUpRequest,
  TopUpResponse,
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
} from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/wallet`;

  getWallet(): Observable<Wallet> {
    return this.http.get<ApiResponse<Wallet>>(this.base).pipe(map(r => {
      if (!r.data) throw new Error('No wallet data returned');
      return r.data;
    }));
  }

  getTransactions(): Observable<WalletTransaction[]> {
    return this.http
      .get<ApiResponse<WalletTransaction[]>>(`${this.base}/transactions`)
      .pipe(map(r => r.data ?? []));
  }

  initiateTopUp(data: TopUpRequest): Observable<TopUpResponse> {
    return this.http
      .post<ApiResponse<TopUpResponse>>(`${this.base}/topup`, data)
      .pipe(map(r => {
        if (!r.data) throw new Error('No top-up response returned');
        return r.data;
      }));
  }

  withdraw(data: WithdrawalRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/withdraw`, data);
  }

  getEarnings(months = 12): Observable<MonthlyEarnings[]> {
    return this.http
      .get<ApiResponse<MonthlyEarnings[]>>(`${this.base}/earnings`, { params: { months } })
      .pipe(map(r => r.data ?? []));
  }

  getConnectOnboardingUrl(): Observable<ConnectOnboardingResponse> {
    return this.http
      .get<ApiResponse<ConnectOnboardingResponse>>(`${this.base}/connect/onboard`)
      .pipe(map(r => {
        if (!r.data) throw new Error('No onboarding URL returned');
        return r.data;
      }));
  }
}
