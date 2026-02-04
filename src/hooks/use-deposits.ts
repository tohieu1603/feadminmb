"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import api from "@/lib/api";
import type { DepositListResponse, DepositFilters } from "@/types";

// Query keys
export const depositKeys = {
  all: ["deposits"] as const,
  lists: () => [...depositKeys.all, "list"] as const,
  list: (filters: DepositFilters) => [...depositKeys.lists(), filters] as const,
  detail: (id: string) => [...depositKeys.all, "detail", id] as const,
};

// Fetch all deposits (admin)
export function useDeposits(filters: DepositFilters = {}) {
  return useQuery({
    queryKey: depositKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.status) params.append("status", filters.status);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.offset) params.append("offset", String(filters.offset));

      const response = await api.get<DepositListResponse>(
        `/deposits/admin/all?${params.toString()}`
      );
      return response.data;
    },
  });
}

// Update deposit (complete or cancel)
export function useUpdateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      depositId,
      action,
      tokens,
      note,
    }: {
      depositId: string;
      action: "complete" | "cancel";
      tokens?: number;
      note?: string;
    }) => {
      const response = await api.post("/deposits/admin/tokens", {
        depositId,
        action,
        tokens,
        note,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.lists() });
      const actionText = variables.action === "complete" ? "hoàn thành" : "hủy";
      message.success(`Đã ${actionText} đơn nạp tiền!`);
    },
    onError: () => {
      message.error("Cập nhật đơn nạp tiền thất bại");
    },
  });
}
