import { UserProfile } from './user.model';

export interface Review {
  id: string;
  bookingId: string;
  toolId: string;
  reviewerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  
  // Relations
  reviewer?: UserProfile;
}

export interface CreateReviewRequest {
  bookingId: string;
  toolId: string;
  rating: number;
  comment: string;
}
