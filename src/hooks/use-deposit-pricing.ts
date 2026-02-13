"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { DepositPricingResponse } from "@/types";

export const depositPricingKeys = {
  all: ["deposit-pricing"] as const,
};

// Fetch deposit pricing
export function useDepositPricing() {
  return useQuery({
    queryKey: depositPricingKeys.all,
    queryFn: async () => {
      const response = await api.get<DepositPricingResponse>("/deposits/pricing");
      return response.data;
    },
  });
}

// Update entire pricing config (admin)
export function useUpdateDepositPricing() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: DepositPricingResponse) => {
      const response = await api.put<DepositPricingResponse>("/deposits/admin/pricing", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(depositPricingKeys.all, data);
      message.success("Cập nhật bảng giá thành công!");
    },
    onError: () => {
      message.error("Cập nhật bảng giá thất bại");
    },
  });
}
