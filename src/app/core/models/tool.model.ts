import { User } from './user.model';
import { Category } from './category.model';

export type ToolStatus = 'active' | 'inactive' | 'draft';

export interface Tool {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category;
  ownerId: string;
  owner?: User;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  tags: string[];
  status: ToolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCreateRequest {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface ToolUpdateRequest extends Partial<ToolCreateRequest> {
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
