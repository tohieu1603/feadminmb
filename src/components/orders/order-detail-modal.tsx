"use client";

import { Modal, Descriptions, Table, Tag, Space, Select, Button, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Order, OrderItem, OrderStatus } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { useUpdateOrderStatus } from "@/hooks/use-orders";
import { useState } from "react";

interface OrderDetailModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}

const formatNumber = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Allowed status transitions
const nextStatusMap: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["processing", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["delivered"],
};

const itemColumns: ColumnsType<OrderItem> = [
  {
    title: "Sản phẩm",
    dataIndex: "name",
    key: "name",
    render: (name, record) => (
      <Space>
        {record.image && (
          <img src={record.image} alt={name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
        )}
        <span>{name}</span>
      </Space>
    ),
  },
  {
    title: "Đơn giá",
    dataIndex: "price",
    key: "price",
    align: "right",
    render: (price) => `${formatNumber(price)} ₫`,
  },
  {
    title: "SL",
    dataIndex: "quantity",
    key: "quantity",
    align: "center",
    width: 60,
  },
  {
    title: "Thành tiền",
    key: "total",
    align: "right",
    render: (_, record) => `${formatNumber(record.price * record.quantity)} ₫`,
  },
];

export function OrderDetailModal({ open, order, onClose }: OrderDetailModalProps) {
  const updateStatus = useUpdateOrderStatus();
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);

  if (!order) return null;

  const allowedNext = nextStatusMap[order.status] || [];

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    await updateStatus.mutateAsync({ id: order.id, status: newStatus });
    setNewStatus(null);
    onClose();
  };

  return (
    <Modal
      title={`Chi tiết đơn hàng #${order.orderCode}`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Mã đơn">{order.orderCode}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <OrderStatusBadge status={order.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Khách hàng">{order.userEmail || order.userId}</Descriptions.Item>
        <Descriptions.Item label="Tổng tiền">
          <span style={{ color: "#f5222d", fontWeight: 600 }}>{formatNumber(order.totalAmount)} ₫</span>
        </Descriptions.Item>
        <Descriptions.Item label="Người nhận">{order.shippingName}</Descriptions.Item>
        <Descriptions.Item label="SĐT">{order.shippingPhone}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ" span={2}>{order.shippingAddress}</Descriptions.Item>
        {order.shippingNote && (
          <Descriptions.Item label="Ghi chú" span={2}>{order.shippingNote}</Descriptions.Item>
        )}
        <Descriptions.Item label="Ngày tạo">
          {new Date(order.createdAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label="Thanh toán">
          {order.paymentMethod || "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider>Sản phẩm</Divider>
      <Table
        columns={itemColumns}
        dataSource={order.items || []}
        rowKey="id"
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3} align="right">
              <strong>Tổng cộng</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <strong style={{ color: "#f5222d" }}>{formatNumber(order.totalAmount)} ₫</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />

      {/* Status update */}
      {allowedNext.length > 0 && (
        <>
          <Divider>Cập nhật trạng thái</Divider>
          <Space>
            <Select
              placeholder="Chọn trạng thái mới"
              style={{ width: 200 }}
              value={newStatus}
              onChange={setNewStatus}
            >
              {allowedNext.map((s) => (
                <Select.Option key={s} value={s}>
                  <OrderStatusBadge status={s} />
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              loading={updateStatus.isPending}
              disabled={!newStatus}
              onClick={handleUpdateStatus}
            >
              Cập nhật
            </Button>
          </Space>
        </>
      )}
    </Modal>
  );
}
