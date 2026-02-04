// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  tokenBalance: number;
  totalDeposited?: number;
  totalSpent?: number;
  apiKeysCount?: number;
  conversationsCount?: number;
  isActive?: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Deposit types
export type DepositStatus = "pending" | "completed" | "cancelled" | "expired";

export interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
}

export interface Deposit {
  id: string;
  userId: string;
  userEmail?: string;
  status: DepositStatus;
  amount: number;
  tokens: number;
  paymentInfo?: PaymentInfo;
  expiresAt?: string;
  completedAt?: string;
  note?: string;
  createdAt: string;
}

export interface DepositListResponse {
  deposits: Deposit[];
  total: number;
  summary?: {
    totalAmount: number;
    totalTokens: number;
    pendingCount: number;
    completedCount: number;
  };
}

// Token types
export type TransactionType =
  | "deposit"
  | "usage"
  | "admin_credit"
  | "admin_debit"
  | "refund"
  | "bonus";

export interface TokenTransaction {
  id: string;
  userId?: string;
  userEmail?: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TokenBalance {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  currency: string;
  lastUpdated: string;
}

export interface TokenTransactionListResponse {
  transactions: TokenTransaction[];
  total: number;
  summary?: {
    totalDeposited: number;
    totalSpent: number;
    netChange: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response types
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// User filters
export interface UserFilters extends PaginationParams {
  role?: "user" | "admin";
}

// Deposit filters
export interface DepositFilters {
  userId?: string;
  status?: DepositStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// Cronjob types
export interface Cronjob {
  id: string;
  customerId: string;
  boxId?: string;
  name: string;
  schedule: string;
  action: string;
  task?: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  // Admin fields (joined)
  userEmail?: string;
  userName?: string;
}

export interface CronjobExecution {
  id: string;
  cronjobId: string;
  status: "running" | "success" | "failure";
  output?: string;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CronjobListResponse {
  cronjobs: Cronjob[];
  total: number;
}

export interface CronjobExecutionListResponse {
  executions: CronjobExecution[];
  total: number;
}

export interface CronjobFilters {
  userId?: string;
  enabled?: boolean;
  limit?: number;
  offset?: number;
}
