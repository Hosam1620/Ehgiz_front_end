export type ToolCondition = 'New' | 'LikeNew' | 'Good' | 'Fair' | 'Poor';
export type ToolConditionValue = 1 | 2 | 3 | 4 | 5;

/** Backend ToolCondition enum: New=1, Good=2, Fair=3, Poor=4, LikeNew=5. */
export const TOOL_CONDITIONS: { label: string; name: ToolCondition; value: ToolConditionValue }[] = [
  { label: 'New', name: 'New', value: 1 },
  { label: 'Like new', name: 'LikeNew', value: 5 },
  { label: 'Good', name: 'Good', value: 2 },
  { label: 'Fair', name: 'Fair', value: 3 },
  { label: 'Poor', name: 'Poor', value: 4 },
];

export function toolConditionLabel(condition: string | null | undefined): string | null {
  if (!condition) return null;
  const byValue = TOOL_CONDITIONS.find(c => String(c.value) === condition);
  if (byValue) return byValue.label;
  const byName = TOOL_CONDITIONS.find(c => c.name.toLowerCase() === condition.toLowerCase());
  return byName?.label ?? condition;
}

export interface ToolImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Tool {
  id: number;
  name: string | null;
  description: string | null;
  pricePerDay: number;
  insurancePrice: number;
  condition: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Filled by the API only for near-me searches. */
  distanceKm: number | null;
  isAvailable: boolean;
  createdAt: string;
  ownerId: number;
  ownerName: string | null;
  ownerProfileImageUrl: string | null;
  categoryId: number;
  categoryName: string | null;
  imageUrls: string[] | null;
  /** Ordered primary-first. */
  images: ToolImage[] | null;
}

export interface CreateToolRequest {
  categoryId: number;
  name: string;
  description: string;
  pricePerDay: number;
  insurancePrice: number;
  condition: ToolConditionValue;
  location: string;
  /** Must be sent together or both omitted. */
  latitude?: number | null;
  longitude?: number | null;
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
  /** Backend enum name: New | LikeNew | Good | Fair | Poor. Omit for all conditions. */
  condition?: ToolCondition;
  /** Near-me search: results are distance-sorted when both coordinates are set. */
  nearLat?: number;
  nearLng?: number;
  radiusKm?: number;
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

export interface ToolSuggestionResponse {
  name: string;
  description: string;
  condition: ToolConditionValue;
  categoryId: number;
  categoryName?: string | null;
}

export interface PhotoSearchResult {
  identifiedObject: string;
  brand?: string | null;
  model?: string | null;
  searchKeywords: string[];
  matchingTools: ToolPagedResult;
}

export interface CategoryOption {
  id: number;
  name: string;
  imageUrl?: string | null;
}
