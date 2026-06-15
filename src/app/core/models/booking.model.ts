import { Tool } from './tool.model';
import { UserProfile } from './user.model';

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  toolId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  tool?: Tool;
  renter?: UserProfile;
  owner?: UserProfile;
}

export interface CreateBookingRequest {
  toolId: string;
  startDate: string;
  endDate: string;
}

export interface BookingDetails extends Booking {
  paymentStatus?: 'pending' | 'held' | 'released' | 'refunded';
  reviewId?: string;
}
