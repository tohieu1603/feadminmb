"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type {
  User,
  UserListResponse,
  UserFilters,
  TokenTransaction,
  Deposit,
} from "@/types";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  deposits: (id: string) => [...userKeys.detail(id), "deposits"] as const,
  transactions: (id: string) => [...userKeys.detail(id), "transactions"] as const,
};

// Fetch users list
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.role) params.append("role", filters.role);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await api.get<UserListResponse>(`/users?${params.toString()}`);
      return response.data;
    },
  });
}

// Fetch single user
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch user deposits
export function useUserDeposits(userId: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...userKeys.deposits(userId), { limit, offset }],
    queryFn: async () => {
      const response = await api.get<{ deposits: Deposit[]; total: number }>(
        `/deposits/admin/all?userId=${userId}&limit=${limit}&offset=${offset}`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

// Fetch user token transactions
export function useUserTransactions(userId: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...userKeys.transactions(userId), { limit, offset }],
    queryFn: async () => {
      const response = await api.get<{
        transactions: TokenTransaction[];
        total: number;
        balance?: { balance: number };
      }>(`/tokens/admin/user/${userId}?limit=${limit}&offset=${offset}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(data.id), data);
      message.success("Cập nhật user thành công!");
    },
    onError: () => {
      message.error("Cập nhật user thất bại");
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      message.success("Xóa user thành công!");
    },
    onError: () => {
      message.error("Xóa user thất bại");
    },
  });
}

// Topup user tokens
export function useTopupUser() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      note,
    }: {
      userId: string;
      amount: number;
      note?: string;
    }) => {
      const response = await api.post(`/users/${userId}/topup`, { amount, note });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      message.success("Nạp token thành công!");
    },
    onError: () => {
      message.error("Nạp token thất bại");
    },
  });
}
