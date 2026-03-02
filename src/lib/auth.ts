import api from "./api";
import type { LoginRequest, LoginResponse, User } from "@/types";

// Login — cookie set by server (HttpOnly), no token storage needed
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
};

// Logout — cookie cleared by server
export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore logout errors
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>("/auth/me");
  return response.data;
};

// Check if user is admin
export const checkAdminRole = (user: User | null): boolean => {
  return user?.role === "admin";
};
