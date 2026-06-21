export type ToolCondition = 'New' | 'Good' | 'Fair' | 'Poor';
export type ToolConditionValue = 1 | 2 | 3 | 4;

export interface Tool {
  id: number;
  name: string | null;
  description: string | null;
  pricePerDay: number;
  insurancePrice: number;
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

export interface CreateToolRequest {
  categoryId: number;
  name: string;
  description: string;
  pricePerDay: number;
  insurancePrice: number;
  condition: ToolConditionValue;
  location: string;
}

export interface UpdateToolRequest extends CreateToolRequest {
  isAvailable: boolean;
}

export interface ToolFilterParams {
  categoryId?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface ToolPagedResult {
  items: Tool[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UploadToolImagesResponse {
  toolId: number;
  imageUrls: string[];
}

export interface CategoryOption {
  id: number;
  name: string;
}
