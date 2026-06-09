export interface AiClassificationRequest {
  text: string;
  categories?: string[];
}

export interface AiClassificationResult {
  label: string;
  confidence: number;
}

export interface AiImageAnalysisRequest {
  imageUrl: string;
  prompt?: string;
}

export interface AiImageAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
}

export interface AiImageSearchRequest {
  imageUrl: string;
  limit?: number;
}

export interface AiSearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AiRagSearchRequest {
  query: string;
  limit?: number;
  filters?: Record<string, string>;
}
