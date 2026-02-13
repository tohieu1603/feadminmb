"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { App } from "antd";
import * as authLib from "@/lib/auth";
import type { LoginRequest, User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // Get current user query
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: authLib.getCurrentUser,
    enabled: authLib.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authLib.login(credentials),
    onSuccess: (data) => {
      // Check if user is admin
      if (data.user.role !== "admin") {
        authLib.removeToken();
        message.error("Bạn không có quyền truy cập trang quản trị");
        return;
      }

      queryClient.setQueryData(["auth", "me"], data.user);
      message.success("Đăng nhập thành công!");
      router.push("/admin");
    },
    onError: () => {
      message.error("Email hoặc mật khẩu không đúng");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authLib.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    error,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isPending,
    refetch,
  };
}
