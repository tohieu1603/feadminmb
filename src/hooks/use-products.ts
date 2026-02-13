"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import api from "@/lib/api";
import type { Product, ProductListResponse, ProductFilters } from "@/types";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  categories: () => [...productKeys.all, "categories"] as const,
  detail: (slug: string) => [...productKeys.all, "detail", slug] as const,
};

// Fetch products list
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.minPrice) params.append("minPrice", String(filters.minPrice));
      if (filters.maxPrice) params.append("maxPrice", String(filters.maxPrice));
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.offset !== undefined) params.append("offset", String(filters.offset));

      const response = await api.get<ProductListResponse>(`/products?${params.toString()}`);
      return response.data;
    },
  });
}

// Fetch categories
export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: async () => {
      const response = await api.get<string[]>("/products/categories");
      return response.data;
    },
  });
}

// Fetch product detail
export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: async () => {
      const response = await api.get<Product>(`/products/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });
}

// Create product (admin)
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post<Product>("/products/admin", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
      message.success("Tạo sản phẩm thành công!");
    },
    onError: () => {
      message.error("Tạo sản phẩm thất bại");
    },
  });
}

// Update product (admin)
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.patch<Product>(`/products/admin/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
      message.success("Cập nhật sản phẩm thành công!");
    },
    onError: () => {
      message.error("Cập nhật sản phẩm thất bại");
    },
  });
}

// Delete product (admin)
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/admin/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      message.success("Xoá sản phẩm thành công!");
    },
    onError: () => {
      message.error("Xoá sản phẩm thất bại");
    },
  });
}
