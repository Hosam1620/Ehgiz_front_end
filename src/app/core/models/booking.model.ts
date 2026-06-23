export type BookingStatus =
  | 'Pending'
  | 'Accepted'
  | 'DeliveryHandover'
  | 'Active'
  | 'ReturnHandover'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
  | 'Disputed';

export type BookingAction =
  | 'Accept'
  | 'Reject'
  | 'Cancel'
  | 'SubmitDeliveryHandover'
  | 'RespondDeliveryHandover'
  | 'SubmitReturnHandover'
  | 'RespondReturnHandover'
  | 'ReportIssue'
  | 'MessageOwner'
  | 'MessageRenter'
  | 'LeaveReview';

export interface HandoverSummary {
  id: number;
  isSubmitted: boolean;
  isAccepted: boolean | null;
  submittedAt: string | null;
  respondedAt: string | null;
  imageCount: number;
}

export interface BookingCard {
  id: number;
  toolId: number;
  toolName: string;
  toolImageUrl: string | null;
  otherPartyId: number;
  otherPartyName: string;
  otherPartyImageUrl: string | null;
  startDate: string;
  endDate: string;
  days: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  deliveryHandover: HandoverSummary | null;
  returnHandover: HandoverSummary | null;
  allowedActions: BookingAction[];
}

export interface HandoverImage {
  id: number;
  imageUrl: string;
  caption: string | null;
}

export interface Handover {
  id: number;
  bookingId: number;
  type: string;
  submittedByName: string;
  submitterNotes: string | null;
  submittedAt: string;
  respondedByName: string | null;
  responderNotes: string | null;
  isAccepted: boolean | null;
  respondedAt: string | null;
  images: HandoverImage[] | null;
}

export interface BookingDetail {
  id: number;
  toolId: number;
  toolName: string;
  toolImageUrl: string | null;
  ownerId: number;
  ownerName: string;
  ownerProfileImageUrl: string | null;
  renterId: number;
  renterName: string;
  renterProfileImageUrl: string | null;
  startDate: string;
  endDate: string;
  days: number;
  rentalCost: number;
  insurancePrice: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: string | null;
  escrowStatus: string | null;
  createdAt: string;
  adminResolutionNotes: string | null;
  handovers: Handover[] | null;
  allowedActions: BookingAction[];
  hasReview: boolean;
}

export interface CreateBookingRequest {
  toolId: number;
  startDate: string;
  endDate: string;
}

export interface CreateBookingResponse {
  bookingId: number;
  rentalCost: number;
  insuranceAmount: number;
  platformFee: number;
  totalCharged: number;
  currency: string;
}

export interface ReportIssueRequest {
  title: string;
  description: string;
}

export interface RespondHandoverRequest {
  accept: boolean;
  notes?: string;
}

export interface BookedDateRange {
  bookingId: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ToolAvailability {
  toolId: number;
  year: number;
  month: number;
  bookedRanges: BookedDateRange[];
}
