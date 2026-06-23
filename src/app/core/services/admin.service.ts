import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BookingDetail } from '../models/booking.model';
import {
  DisputeDetails,
  IssueReport,
  PartialRefundRequest,
  PlatformFeeResponse,
  ResolveDisputeRequest,
  UpdateIssueStatusRequest,
  UpdatePlatformFeeRequest,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin`;

  getDisputes(): Observable<BookingDetail[]> {
    return this.http
      .get<ApiResponse<BookingDetail[]>>(`${this.base}/disputes`)
      .pipe(map(r => r.data ?? []));
  }

  getDisputeDetails(bookingId: number): Observable<DisputeDetails> {
    return this.http
      .get<ApiResponse<DisputeDetails>>(`${this.base}/disputes/${bookingId}`)
      .pipe(map(r => r.data!));
  }

  resolveForOwner(bookingId: number, data: ResolveDisputeRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/disputes/${bookingId}/favor-owner`, data);
  }

  resolveForRenter(bookingId: number, data: ResolveDisputeRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/disputes/${bookingId}/favor-renter`, data);
  }

  partialRefund(bookingId: number, data: PartialRefundRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/disputes/${bookingId}/partial-refund`, data);
  }

  forceComplete(bookingId: number, data: ResolveDisputeRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/disputes/${bookingId}/force-complete`, data);
  }

  forceCancel(bookingId: number, data: ResolveDisputeRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/disputes/${bookingId}/force-cancel`, data);
  }

  getIssueReports(): Observable<IssueReport[]> {
    return this.http
      .get<ApiResponse<IssueReport[]>>(`${this.base}/issue-reports`)
      .pipe(map(r => r.data ?? []));
  }

  getIssueReportById(id: number): Observable<IssueReport> {
    return this.http
      .get<ApiResponse<IssueReport>>(`${this.base}/issue-reports/${id}`)
      .pipe(map(r => r.data!));
  }

  updateIssueStatus(id: number, data: UpdateIssueStatusRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/issue-reports/${id}/status`, data);
  }

  getPlatformFee(): Observable<number> {
    return this.http
      .get<PlatformFeeResponse>(`${this.base}/settings/platform-fee`)
      .pipe(map(r => r.feePercent));
  }

  updatePlatformFee(data: UpdatePlatformFeeRequest): Observable<{ message: string; feePercent: number }> {
    return this.http.put<{ message: string; feePercent: number }>(
      `${this.base}/settings/platform-fee`,
      data
    );
  }
}
