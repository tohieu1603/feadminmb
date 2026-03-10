"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Author, AuthorFilters } from "@/types";

export const authorKeys = {
  all: ["post-authors"] as const,
  lists: () => [...authorKeys.all, "list"] as const,
  list: (filters?: AuthorFilters) => [...authorKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...authorKeys.all, "detail", id] as const,
};

// Fetch list
export function useAuthors(filters: AuthorFilters = {}) {
  return useQuery({
    queryKey: authorKeys.list(filters),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      const response = await api.get<{ data: Author[] }>(`/post-authors?${params.toString()}`);
      return response.data.data;
    },
  });
}

// Create
export function useCreateAuthor() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<Author>("/post-authors", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorKeys.lists() });
      message.success("Tạo tác giả thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Tạo tác giả thất bại");
    },
  });
}

// Update
export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put<Author>(`/post-authors/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: authorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: authorKeys.detail(id) });
      message.success("Cập nhật tác giả thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Cập nhật tác giả thất bại");
    },
  });
}

// Delete
export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/post-authors/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorKeys.lists() });
      message.success("Xóa tác giả thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Xóa tác giả thất bại");
    },
  });
}

// Toggle active
export function useToggleAuthorActive() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Author>(`/post-authors/${id}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorKeys.lists() });
      message.success("Cập nhật trạng thái thành công!");
    },
    onError: () => {
      message.error("Cập nhật trạng thái thất bại");
    },
  });
}

// Toggle featured
export function useToggleAuthorFeatured() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Author>(`/post-authors/${id}/toggle-featured`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorKeys.lists() });
      message.success("Cập nhật nổi bật thành công!");
    },
    onError: () => {
      message.error("Cập nhật nổi bật thất bại");
    },
  });
}
