import { BookingDetail } from './booking.model';
import { Handover } from './booking.model';

export type IssueReportStatus = 'Open' | 'InReview' | 'Resolved' | 'Closed' | 'Rejected';

export interface IssueReport {
  id: number;
  reporterName: string;
  title: string | null;
  description: string | null;
  status: IssueReportStatus;
  createdAt: string;
}

export interface DisputeDetails {
  booking: BookingDetail;
  issues: IssueReport[];
  handovers: Handover[];
}

export interface ResolveDisputeRequest {
  resolutionNotes?: string;
}

export interface PartialRefundRequest {
  refundPercentage: number;
  resolutionNotes?: string;
}

export interface UpdateIssueStatusRequest {
  status: IssueReportStatus;
}

export interface PlatformFeeResponse {
  feePercent: number;
}

export interface UpdatePlatformFeeRequest {
  feePercent: number;
}

// ── Dashboard ────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  availableListings: number;
  activeBookings: number;
  disputedBookings: number;
  openIssueReports: number;
  totalRevenue: number;
  pendingEscrow: number;
}

// ── Users ────────────────────────────────────────────

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  city: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}

export interface SetUserRoleRequest {
  role: string;
}

// ── Listings ─────────────────────────────────────────

export interface AdminListing {
  id: number;
  name: string | null;
  description: string | null;
  pricePerDay: number;
  condition: string | null;
  location: string | null;
  isAvailable: boolean;
  createdAt: string;
  ownerId: number;
  ownerName: string | null;
  categoryId: number;
  categoryName: string | null;
  imageUrls: string[] | null;
}

export interface SetListingAvailabilityRequest {
  isAvailable: boolean;
}

// ── Categories ───────────────────────────────────────

export interface AdminCategory {
  id: number;
  name: string;
  description: string | null;
  toolCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

// ── Payments ─────────────────────────────────────────

export interface AdminPayment {
  id: number;
  bookingId: number;
  payerName: string | null;
  amount: number;
  status: string;
  method: string | null;
  createdAt: string;
}
