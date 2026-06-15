import { UserProfile } from './user.model';
import { Category } from './category.model';
import { Review } from './review.model';

export type ToolStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';
export type ToolCondition = 'new' | 'excellent' | 'good' | 'fair';

export interface ToolLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category;
  ownerId: string;
  owner?: UserProfile;
  dailyRate: number;
  hourlyRate?: number;
  depositAmount: number;
  images: string[];
  status: ToolStatus;
  condition: ToolCondition;
  location: ToolLocation;
  brand?: string;
  model?: string;
  features: string[];
  rules: string[];
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolRequest {
  name: string;
  description: string;
  categoryId: string;
  dailyRate: number;
  hourlyRate?: number;
  depositAmount: number;
  images: string[]; // base64 or pre-uploaded URLs
  condition: ToolCondition;
  location: ToolLocation;
  brand?: string;
  model?: string;
  features: string[];
  rules: string[];
}

export interface ToolUpdateRequest extends Partial<CreateToolRequest> {
  status?: ToolStatus;
}

export interface ToolSearchParams {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  pageSize?: number;
}
