"use client";

import { Tag } from "antd";
import type { OrderStatus } from "@/types";

const statusConfig: Record<OrderStatus, { color: string; label: string }> = {
  pending: { color: "orange", label: "Chờ thanh toán" },
  processing: { color: "blue", label: "Đang xử lý" },
  shipping: { color: "cyan", label: "Đang giao" },
  delivered: { color: "green", label: "Đã giao" },
  cancelled: { color: "red", label: "Đã huỷ" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] || { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
