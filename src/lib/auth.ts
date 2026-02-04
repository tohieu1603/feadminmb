import api, { setToken, removeToken, getToken } from "./api";
import type { LoginRequest, LoginResponse, User } from "@/types";

// Login
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  const { accessToken, user } = response.data;

  // Store token
  if (accessToken) {
    setToken(accessToken);
  }

  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore logout errors
  } finally {
    removeToken();
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>("/auth/me");
  return response.data;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check if user is admin
export const checkAdminRole = (user: User | null): boolean => {
  return user?.role === "admin";
};

export { getToken, setToken, removeToken };
