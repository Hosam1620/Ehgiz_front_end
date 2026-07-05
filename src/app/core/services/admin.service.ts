import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BookingDetail } from '../models/booking.model';
import {
  AdminCategory,
  AdminDashboardStats,
  AdminListing,
  AdminUser,
  AdminWallet,
  AdminWalletTransaction,
  CreateCategoryRequest,
  DisputeDetails,
  IssueReport,
  PartialRefundRequest,
  PlatformFeeResponse,
  ResolveDisputeRequest,
  SetListingAvailabilityRequest,
  SetUserActiveRequest,
  SetUserRoleRequest,
  UpdateCategoryRequest,
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
      .get<ApiResponse<PlatformFeeResponse>>(`${this.base}/settings/platform-fee`)
      .pipe(map(r => r.data?.feePercent ?? 0));
  }

  updatePlatformFee(data: UpdatePlatformFeeRequest): Observable<{ message: string; feePercent: number }> {
    return this.http
      .put<ApiResponse<{ feePercent: number }>>(`${this.base}/settings/platform-fee`, data)
      .pipe(map(r => ({ message: r.message, feePercent: r.data?.feePercent ?? data.feePercent })));
  }

  // ── Dashboard ──────────────────────────────────────

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http
      .get<ApiResponse<AdminDashboardStats>>(`${this.base}/dashboard`)
      .pipe(map(r => r.data!));
  }

  // ── Users ──────────────────────────────────────────

  getUsers(isActive?: boolean): Observable<AdminUser[]> {
    const params: Record<string, string> = {};
    if (isActive !== undefined) params['isActive'] = String(isActive);
    return this.http
      .get<ApiResponse<any[]>>(`${this.base}/users`, { params })
      .pipe(map(r => (r.data ?? []).map(u => this.mapUserDto(u))));
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http
      .get<ApiResponse<any>>(`${this.base}/users/${id}`)
      .pipe(map(r => this.mapUserDto(r.data!)));
  }

  // Backend returns `role: string`; model expects `roles: string[]`
  private mapUserDto(raw: any): AdminUser {
    return { ...raw, roles: raw.role ? [raw.role] : [] };
  }

  setUserActive(id: number, data: SetUserActiveRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/users/${id}/active`, data);
  }

  setUserRole(id: number, data: SetUserRoleRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/users/${id}/role`, data);
  }

  deleteUser(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/users/${id}`);
  }

  // ── Listings ───────────────────────────────────────

  getListings(): Observable<AdminListing[]> {
    return this.http
      .get<ApiResponse<AdminListing[]>>(`${this.base}/listings`)
      .pipe(map(r => r.data ?? []));
  }

  getListingById(id: number): Observable<AdminListing> {
    return this.http
      .get<ApiResponse<AdminListing>>(`${this.base}/listings/${id}`)
      .pipe(map(r => r.data!));
  }

  setListingAvailability(id: number, data: SetListingAvailabilityRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/listings/${id}/availability`, data);
  }

  deleteListing(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/listings/${id}`);
  }

  // ── Categories ─────────────────────────────────────

  getAdminCategories(): Observable<AdminCategory[]> {
    return this.http
      .get<ApiResponse<AdminCategory[]>>(`${this.base}/categories`)
      .pipe(map(r => r.data ?? []));
  }

  createCategory(data: CreateCategoryRequest): Observable<ApiResponse<AdminCategory>> {
    return this.http.post<ApiResponse<AdminCategory>>(`${this.base}/categories`, data);
  }

  updateCategory(id: number, data: UpdateCategoryRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/categories/${id}`);
  }

  // ── Wallets ────────────────────────────────────────

  getWallets(): Observable<AdminWallet[]> {
    return this.http
      .get<ApiResponse<AdminWallet[]>>(`${this.base}/wallets`)
      .pipe(map(r => r.data ?? []));
  }

  getAllTransactions(): Observable<AdminWalletTransaction[]> {
    return this.http
      .get<ApiResponse<AdminWalletTransaction[]>>(`${this.base}/transactions`)
      .pipe(map(r => r.data ?? []));
  }
}
