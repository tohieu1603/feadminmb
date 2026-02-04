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
  DatePicker,
  Statistic,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  DollarOutlined,
  WalletOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Deposit, DepositFilters, DepositStatus } from "@/types";
import { useDeposits } from "@/hooks/use-deposits";
import { DepositStatusBadge } from "@/components/deposits/deposit-status-badge";
import { DepositActionModal } from "@/components/deposits/deposit-action-modal";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function DepositsPage() {
  const [filters, setFilters] = useState<DepositFilters>({
    limit: 20,
    offset: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [actionType, setActionType] = useState<"complete" | "cancel">("complete");
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const { data, isLoading, refetch } = useDeposits(filters);

  // Handle status filter
  const handleStatusFilter = (status: DepositStatus | undefined) => {
    setFilters((prev) => ({ ...prev, status, offset: 0 }));
  };

  // Handle date range filter
  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ) => {
    setDateRange(dates || [null, null]);
    if (dates && dates[0] && dates[1]) {
      setFilters((prev) => ({
        ...prev,
        from: dates[0]!.startOf("day").toISOString(),
        to: dates[1]!.endOf("day").toISOString(),
        offset: 0,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        from: undefined,
        to: undefined,
        offset: 0,
      }));
    }
  };

  // Handle pagination
  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }));
  };

  // Handle actions
  const handleComplete = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setActionType("complete");
    setActionModalOpen(true);
  };

  const handleCancel = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setActionType("cancel");
    setActionModalOpen(true);
  };

  // Format number
  const formatNumber = (value: number | undefined) => {
    if (value === undefined) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Table columns
  const columns: ColumnsType<Deposit> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      ellipsis: true,
    },
    {
      title: "User",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 200,
      ellipsis: true,
      render: (email, record) => email || record.userId,
    },
    {
      title: "Số tiền (VND)",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right",
      render: (amount) => formatNumber(amount),
    },
    {
      title: "Tokens",
      dataIndex: "tokens",
      key: "tokens",
      width: 150,
      align: "right",
      render: (tokens) => (
        <span style={{ color: "#52c41a", fontWeight: 500 }}>
          {formatNumber(tokens)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => <DepositStatusBadge status={status} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        if (record.status !== "pending") {
          return <span style={{ color: "#999" }}>-</span>;
        }
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              Xác nhận
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleCancel(record)}
            >
              Hủy
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Nạp tiền
        </Title>
      </div>

      {/* Stats */}
      {data?.summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng doanh thu"
                value={data.summary.totalAmount}
                formatter={(val) => `${formatNumber(val as number)} VND`}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a", fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng Tokens"
                value={data.summary.totalTokens}
                formatter={(val) => formatNumber(val as number)}
                prefix={<WalletOutlined />}
                valueStyle={{ color: "#1890ff", fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Đơn chờ xử lý"
                value={data.summary.pendingCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14", fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Đơn hoàn thành"
                value={data.summary.completedCount}
                prefix={<CheckOutlined />}
                valueStyle={{ color: "#52c41a", fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              allowClear
              value={filters.status}
              onChange={handleStatusFilter}
            >
              <Select.Option value="pending">Chờ thanh toán</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
              <Select.Option value="expired">Hết hạn</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
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
          dataSource={data?.deposits || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
            pageSize: filters.limit || 20,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* Action Modal */}
      <DepositActionModal
        open={actionModalOpen}
        deposit={selectedDeposit}
        action={actionType}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedDeposit(null);
        }}
      />
    </div>
  );
}
