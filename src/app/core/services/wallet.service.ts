import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Wallet, TopUpRequest, TopUpResponse, WalletTransaction } from '../models/wallet.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/wallet`;

  getWallet(): Observable<ApiResponse<Wallet>> {
    return this.http.get<ApiResponse<Wallet>>(this.baseUrl);
  }

  getTransactions(): Observable<ApiResponse<WalletTransaction[]>> {
    return this.http.get<ApiResponse<WalletTransaction[]>>(`${this.baseUrl}/transactions`);
  }

  initiateTopUp(request: TopUpRequest): Observable<ApiResponse<TopUpResponse>> {
    return this.http.post<ApiResponse<TopUpResponse>>(`${this.baseUrl}/topup`, request);
  }
}
