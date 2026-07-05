import { ToolCondition } from './tool.model';

export interface SavedSearch {
  id: number;
  searchTerm: string | null;
  categoryId: number | null;
  categoryName: string | null;
  location: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** Backend enum name: New | LikeNew | Good | Fair | Poor. */
  condition: string | null;
  createdAt: string;
}

export interface CreateSavedSearchRequest {
  searchTerm?: string;
  categoryId?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Backend enum name. */
  condition?: ToolCondition;
}
