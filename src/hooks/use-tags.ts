"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Tag, TagFilters } from "@/types";

export const tagKeys = {
  all: ["post-tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
  list: (filters?: TagFilters) => [...tagKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...tagKeys.all, "detail", id] as const,
};

// Fetch list
export function useTags(filters: TagFilters = {}) {
  return useQuery({
    queryKey: tagKeys.list(filters),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      const response = await api.get<Tag[]>(`/post-tags?${params.toString()}`);
      return response.data;
    },
  });
}

// Fetch single
export function useTag(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Tag>(`/post-tags/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create
export function useCreateTag() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<Tag>("/post-tags", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      message.success("Tạo tag thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Tạo tag thất bại");
    },
  });
}

// Update
export function useUpdateTag() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put<Tag>(`/post-tags/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(id) });
      message.success("Cập nhật tag thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Cập nhật tag thất bại");
    },
  });
}

// Delete
export function useDeleteTag() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/post-tags/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      message.success("Xóa tag thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Xóa tag thất bại");
    },
  });
}

// Toggle active
export function useToggleTagActive() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Tag>(`/post-tags/${id}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      message.success("Cập nhật trạng thái thành công!");
    },
    onError: () => {
      message.error("Cập nhật trạng thái thất bại");
    },
  });
}
