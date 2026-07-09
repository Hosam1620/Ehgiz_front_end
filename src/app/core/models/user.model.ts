export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  password: string;
  /** Optional profile picture uploaded at signup. */
  profileImage?: File | null;
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
  roles?: string[];
  role?: string;
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

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
}
