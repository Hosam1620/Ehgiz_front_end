export interface Review {
  id: number;
  bookingId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  toolId: number;
  toolName: string;
  renterName: string;
  renterProfileImageUrl: string | null;
}

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ToolRating {
  toolId: number;
  averageRating: number;
}
