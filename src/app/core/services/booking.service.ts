import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  BookingCard,
  BookingDetail,
  CreateBookingRequest,
  CreateBookingResponse,
  ReportIssueRequest,
  RespondHandoverRequest,
  ToolAvailability,
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/bookings`;

  getMyBookings(): Observable<BookingCard[]> {
    return this.http
      .get<ApiResponse<BookingCard[]>>(`${this.base}/my`)
      .pipe(map(r => r.data ?? []));
  }

  getReceivedBookings(): Observable<BookingCard[]> {
    return this.http
      .get<ApiResponse<BookingCard[]>>(`${this.base}/received`)
      .pipe(map(r => r.data ?? []));
  }

  getById(id: number): Observable<BookingDetail> {
    return this.http
      .get<ApiResponse<BookingDetail>>(`${this.base}/${id}`)
      .pipe(map(r => r.data!));
  }

  create(data: CreateBookingRequest): Observable<CreateBookingResponse> {
    return this.http
      .post<ApiResponse<CreateBookingResponse>>(this.base, data)
      .pipe(map(r => r.data!));
  }

  cancel(id: number): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${id}/cancel`, {});
  }

  accept(id: number): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${id}/accept`, {});
  }

  reject(id: number): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${id}/reject`, {});
  }

  submitDeliveryHandover(id: number, notes: string | null, images: File[]): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.base}/${id}/handover/delivery`,
      this.buildHandoverForm(notes, images)
    );
  }

  respondDeliveryHandover(id: number, data: RespondHandoverRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${id}/handover/delivery/respond`, data);
  }

  submitReturnHandover(id: number, notes: string | null, images: File[]): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.base}/${id}/handover/return`,
      this.buildHandoverForm(notes, images)
    );
  }

  respondReturnHandover(id: number, data: RespondHandoverRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${id}/handover/return/respond`, data);
  }

  reportIssue(id: number, data: ReportIssueRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/report-issue`, data);
  }

  getToolAvailability(toolId: number, year: number, month: number): Observable<ToolAvailability> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http
      .get<ApiResponse<ToolAvailability>>(`${this.base}/tool/${toolId}/availability`, { params })
      .pipe(map(r => r.data!));
  }

  private buildHandoverForm(notes: string | null, images: File[]): FormData {
    const form = new FormData();
    if (notes) {
      form.append('notes', notes);
    }
    images.forEach(img => form.append('images', img));
    return form;
  }
}
