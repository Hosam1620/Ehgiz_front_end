import { User } from './user.model';

export interface Review {
  id: string;
  toolId: string;
  userId: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateRequest {
  toolId: string;
  rating: number;
  comment: string;
}
