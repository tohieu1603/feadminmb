"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Input,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Order, OrderFilters, OrderStatus } from "@/types";
import { useOrders } from "@/hooks/use-orders";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";

const { Title } = Typography;

const formatNumber = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({ limit: 20, page: 1 });
  const [searchText, setSearchText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = useOrders(filters);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchText || undefined, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, limit: pageSize }));
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 140,
      render: (code) => <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{code}</span>,
    },
    {
      title: "Khách hàng",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 200,
      ellipsis: true,
      render: (email, record) => email || record.userName || record.userId,
    },
    {
      title: "Sản phẩm",
      key: "items",
      width: 250,
      ellipsis: true,
      render: (_, record) => {
        const items = record.items || [];
        const count = record.itemCount || items.length;
        if (items.length === 0) return `${count} sản phẩm`;
        const first = items[0];
        return (
          <span>
            {first.name} {first.quantity > 1 ? `x${first.quantity}` : ""}
            {count > 1 ? ` (+${count - 1})` : ""}
          </span>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      align: "right",
      render: (amount) => (
        <span style={{ color: "#f5222d", fontWeight: 500 }}>{formatNumber(amount)} ₫</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => <OrderStatusBadge status={status} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const currentPage = data?.pagination?.page || filters.page || 1;
  const total = data?.pagination?.total ?? data?.total ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Đơn hàng</Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm mã đơn, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              allowClear
              value={filters.status}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val, page: 1 }))}
            >
              <Select.Option value="pending">Chờ thanh toán</Select.Option>
              <Select.Option value="processing">Đang xử lý</Select.Option>
              <Select.Option value="shipping">Đang giao</Select.Option>
              <Select.Option value="delivered">Đã giao</Select.Option>
              <Select.Option value="cancelled">Đã huỷ</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.orders || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: currentPage,
            pageSize: filters.limit || 20,
            total,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} đơn hàng`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <OrderDetailModal
        open={detailOpen}
        order={selectedOrder}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
          refetch();
        }}
      />
    </div>
  );
}
