"use client";

import { Tag } from "antd";
import type { DepositStatus } from "@/types";

interface DepositStatusBadgeProps {
  status: DepositStatus;
}

const statusConfig: Record<DepositStatus, { color: string; label: string }> = {
  pending: { color: "orange", label: "Chờ thanh toán" },
  completed: { color: "green", label: "Hoàn thành" },
  cancelled: { color: "red", label: "Đã hủy" },
  expired: { color: "default", label: "Hết hạn" },
};

export function DepositStatusBadge({ status }: DepositStatusBadgeProps) {
  const config = statusConfig[status] || { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
