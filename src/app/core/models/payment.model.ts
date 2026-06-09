export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitiateRequest {
  bookingId: string;
  method: string;
}
