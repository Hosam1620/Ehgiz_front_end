export interface ToolAssistantRequest {
  question: string;
}

export interface ToolRecommendation {
  id: number;
  name: string;
  description: string | null;
  pricePerDay: number;
  categoryName: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
}

export interface ToolAssistantResponse {
  answer: string;
  recommendedTools: ToolRecommendation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedTools?: ToolRecommendation[];
  timestamp: Date;
  loading?: boolean;
  error?: string;
  /** The original user question, kept on failed assistant messages so they can be retried. */
  retryPrompt?: string;
}
