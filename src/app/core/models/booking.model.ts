import { Tool } from './tool.model';
import { User } from './user.model';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  toolId: string;
  tool?: Tool;
  userId: string;
  user?: User;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateRequest {
  toolId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}
