"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Post, PostListResponse, PostFilters, Category, Author, Tag } from "@/types";

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  detail: (id: string) => [...postKeys.all, "detail", id] as const,
  categories: () => ["categories"] as const,
  authors: () => ["authors"] as const,
  tags: () => ["tags"] as const,
};

// Fetch posts list
export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: postKeys.list(filters),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);

      const response = await api.get<PostListResponse>(`/posts?${params.toString()}`);
      return response.data;
    },
  });
}

// Fetch post detail
export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Post>(`/posts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: postKeys.categories(),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const response = await api.get<Category[]>("/post-categories");
      return response.data;
    },
  });
}

// Fetch authors
export function useAuthors() {
  return useQuery({
    queryKey: postKeys.authors(),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const response = await api.get<{ data: Author[] }>("/post-authors?limit=100");
      return response.data.data;
    },
  });
}

// Fetch tags
export function useTags() {
  return useQuery({
    queryKey: postKeys.tags(),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const response = await api.get<Tag[]>("/post-tags");
      return response.data;
    },
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<Post>("/posts", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      message.success("Đã tạo bài viết thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Tạo bài viết thất bại");
    },
  });
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put<Post>(`/posts/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      message.success("Đã cập nhật bài viết thành công!");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || "Cập nhật bài viết thất bại");
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      message.success("Đã xóa bài viết thành công!");
    },
    onError: () => {
      message.error("Xóa bài viết thất bại");
    },
  });
}
