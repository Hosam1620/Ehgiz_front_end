export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  address: string | null;
  city: string | null;
  createdAt: string; // ISO 8601
  isActive: boolean;
  roles: string[];
}
