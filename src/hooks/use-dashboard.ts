"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UserListResponse, DepositListResponse, TokenTransactionListResponse } from "@/types";

// Dashboard stats
interface DashboardStats {
  totalUsers: number;
  totalTokensBalance: number;
  totalDeposits: number;
  totalRevenue: number;
  pendingDeposits: number;
  recentUsers: number;
}

// Fetch dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Fetch multiple endpoints in parallel
      const [usersRes, depositsRes] = await Promise.all([
        api.get<UserListResponse>("/users?limit=1"),
        api.get<DepositListResponse>("/deposits/admin/all?limit=1"),
      ]);

      const stats: DashboardStats = {
        totalUsers: usersRes.data.pagination?.total || 0,
        totalTokensBalance: 0, // Would need separate endpoint
        totalDeposits: depositsRes.data.total || 0,
        totalRevenue: depositsRes.data.summary?.totalAmount || 0,
        pendingDeposits: depositsRes.data.summary?.pendingCount || 0,
        recentUsers: 0, // Would need separate query
      };

      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch recent deposits
export function useRecentDeposits(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recent-deposits", limit],
    queryFn: async () => {
      const response = await api.get<DepositListResponse>(
        `/deposits/admin/all?limit=${limit}&offset=0`
      );
      return response.data.deposits || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch recent transactions
export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recent-transactions", limit],
    queryFn: async () => {
      const response = await api.get<TokenTransactionListResponse>(
        `/tokens/admin/all?limit=${limit}&offset=0`
      );
      return response.data.transactions || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
