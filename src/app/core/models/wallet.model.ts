export interface Wallet {
  id: number;
  balance: number;
  heldBalance: number;
  totalBalance: number;
}

export interface TopUpRequest {
  amount: number;
  currency?: string;
}

export interface TopUpResponse {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface WithdrawalRequest {
  amount: number;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

export interface ConnectOnboardingResponse {
  onboardingUrl: string;
}

export interface MonthlyEarnings {
  /** "yyyy-MM" */
  month: string;
  gross: number;
  fees: number;
  net: number;
}
