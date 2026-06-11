export interface Wallet {
  id: number;
  balance: number;
  heldBalance: number;
  totalBalance: number;
}

export interface TopUpRequest {
  amount: number;
  currency: string;
}

export interface TopUpResponse {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
}
