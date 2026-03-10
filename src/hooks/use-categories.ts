"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Category, CategoryFilters } from "@/types";

export const categoryKeys = {
  all: ["post-categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters?: CategoryFilters) => [...categoryKeys.lists(), filters ?? {}] as const,
  tree: () => [...categoryKeys.all, "tree"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
};

// Fetch flat list
export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.parentId) params.append("parentId", filters.parentId);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      const response = await api.get<Category[]>(`/post-categories?${params.toString()}`);
      return response.data;
    },
  });
}

// Fetch tree structure
export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const response = await api.get<Category[]>("/post-categories/tree");
      return response.data;
    },
  });
}

// Fetch single
export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Category>(`/post-categories/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<Category>("/post-categories", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      message.success("Tạo danh mục thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Tạo danh mục thất bại");
    },
  });
}

// Update
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put<Category>(`/post-categories/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      message.success("Cập nhật danh mục thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Cập nhật danh mục thất bại");
    },
  });
}

// Delete
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/post-categories/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      message.success("Xóa danh mục thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Không thể xóa danh mục (có thể có danh mục con)");
    },
  });
}

// Toggle active
export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Category>(`/post-categories/${id}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      message.success("Cập nhật trạng thái thành công!");
    },
    onError: () => {
      message.error("Cập nhật trạng thái thất bại");
    },
  });
}
