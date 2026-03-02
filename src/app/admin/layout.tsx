"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      router.push("/login");
    }
  }, [isLoading, user, isAdmin, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <Spin size="large" tip="Đang tải..." fullscreen />;
  }

  // Don't render if not admin
  if (!user || !isAdmin) {
    return <Spin size="large" fullscreen />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
