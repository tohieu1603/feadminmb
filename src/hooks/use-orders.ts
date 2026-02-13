"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Order, OrderListResponse, OrderFilters, OrderStatus } from "@/types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

// Fetch all orders (admin)
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.status) params.append("status", filters.status);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get<OrderListResponse>(
        `/orders/admin/all?${params.toString()}`
      );
      return response.data;
    },
  });
}

// Fetch order detail
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Order>(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Update order status (admin)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await api.patch<Order>(`/orders/admin/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success("Cập nhật trạng thái đơn hàng thành công!");
    },
    onError: () => {
      message.error("Cập nhật trạng thái thất bại");
    },
  });
}

// Cancel order (admin)
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/orders/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      message.success("Đã huỷ đơn hàng!");
    },
    onError: () => {
      message.error("Huỷ đơn hàng thất bại");
    },
  });
}
