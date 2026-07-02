import { BookingDetail } from './booking.model';
import { Handover } from './booking.model';

export type IssueReportStatus = 'Open' | 'UnderReview' | 'Resolved';

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
  activeListings: number;
  totalBookings: number;
  activeBookings: number;
  disputedBookings: number;
  openIssueReports: number;
  totalCategories: number;
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
  address: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  totalListings: number;
  totalBookings: number;
  stripeCustomerId: string | null;
  stripeAccountId: string | null;
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

// ── Wallets ───────────────────────────────────────────

export interface AdminWallet {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  balance: number;
  heldBalance: number;
  updatedAt: string;
}

export interface AdminWalletTransaction {
  id: number;
  walletId: number;
  userId: number;
  userFullName: string;
  amount: number;
  type: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

export const TRANSACTION_TYPES = [
  'TopUp',
  'BookingDebit',
  'EarningCredit',
  'InsuranceRefund',
  'BookingRefund',
  'Withdrawal',
  'LateFeeDebit',
  'LateFeeCredit',
  'PartialRefund',
  'DisputeCredit',
  'AdminReversal',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Transaction types that can be safely reversed at the wallet level; the rest return a 400 if attempted.
const REVERSIBLE_TRANSACTION_TYPES: readonly string[] = [
  'EarningCredit',
  'InsuranceRefund',
  'BookingRefund',
  'LateFeeCredit',
  'PartialRefund',
  'DisputeCredit',
];

export function isReversibleTransactionType(type: string): boolean {
  return REVERSIBLE_TRANSACTION_TYPES.includes(type);
}

const TRANSACTION_TYPE_CLASSES: Record<string, string> = {
  TopUp: 'chip-green',
  BookingDebit: 'chip-red',
  EarningCredit: 'chip-green',
  InsuranceRefund: 'chip-blue',
  BookingRefund: 'chip-blue',
  Withdrawal: 'chip-red',
  LateFeeDebit: 'chip-red',
  LateFeeCredit: 'chip-amber',
  PartialRefund: 'chip-blue',
  DisputeCredit: 'chip-amber',
  AdminReversal: 'chip-gray',
};

export function walletTransactionTypeClass(type: string): string {
  return TRANSACTION_TYPE_CLASSES[type] ?? 'chip-gray';
}

// ── Transaction list/rollback ─────────────────────────

export interface RollbackTransactionRequest {
  reason: string;
}

export interface RollbackTransactionResponse {
  originalTransactionId: number;
  senderUserId: number;
  receiverUserId: number;
  amount: number;
  reason: string;
  createdAt: string;
}
