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
