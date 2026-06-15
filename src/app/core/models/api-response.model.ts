export interface ApiResponse<T> {
  succeeded: boolean;
  message: string;
  data: T | null;
  errors: string[];
}
