"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Table,
  Statistic,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  WalletOutlined,
  EditOutlined,
  UserOutlined,
  HistoryOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TokenTransaction, Deposit } from "@/types";
import { useUser, useUserDeposits, useUserTransactions } from "@/hooks/use-users";
import { TopupModal } from "@/components/users/topup-modal";
import { UserEditModal } from "@/components/users/user-edit-modal";

const { Title, Text } = Typography;

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [depositsPage, setDepositsPage] = useState({ limit: 10, offset: 0 });
  const [transactionsPage, setTransactionsPage] = useState({ limit: 10, offset: 0 });

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: depositsData, isLoading: depositsLoading } = useUserDeposits(
    userId,
    depositsPage.limit,
    depositsPage.offset
  );
  const { data: transactionsData, isLoading: transactionsLoading } = useUserTransactions(
    userId,
    transactionsPage.limit,
    transactionsPage.offset
  );

  // Format number
  const formatNumber = (value: number | undefined) => {
    if (value === undefined) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Deposit columns
  const depositColumns: ColumnsType<Deposit> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      ellipsis: true,
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
        <span style={{ color: "#52c41a", fontWeight: 500 }}>+{formatNumber(tokens)}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const colors: Record<string, string> = {
          pending: "orange",
          completed: "green",
          cancelled: "red",
          expired: "default",
        };
        const labels: Record<string, string> = {
          pending: "Chờ",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
          expired: "Hết hạn",
        };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  // Transaction columns
  const transactionColumns: ColumnsType<TokenTransaction> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (type) => {
        const colors: Record<string, string> = {
          deposit: "green",
          usage: "red",
          admin_credit: "blue",
          admin_debit: "orange",
          refund: "purple",
          bonus: "cyan",
        };
        const labels: Record<string, string> = {
          deposit: "Nạp tiền",
          usage: "Sử dụng",
          admin_credit: "Admin cộng",
          admin_debit: "Admin trừ",
          refund: "Hoàn",
          bonus: "Thưởng",
        };
        return <Tag color={colors[type]}>{labels[type] || type}</Tag>;
      },
    },
    {
      title: "Số lượng",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right",
      render: (amount) => (
        <span style={{ color: amount >= 0 ? "#52c41a" : "#ff4d4f", fontWeight: 500 }}>
          {amount >= 0 ? "+" : ""}
          {formatNumber(amount)}
        </span>
      ),
    },
    {
      title: "Số dư",
      dataIndex: "balance",
      key: "balance",
      width: 150,
      align: "right",
      render: (balance) => formatNumber(balance),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc) => desc || "-",
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  if (userLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Empty description="Không tìm thấy user" />
        <Button type="link" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: (
        <span>
          <UserOutlined />
          Tổng quan
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Số dư Token"
                value={user.tokenBalance}
                formatter={(val) => formatNumber(val as number)}
                prefix={<WalletOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng đã nạp"
                value={user.totalDeposited || 0}
                formatter={(val) => formatNumber(val as number)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Đã sử dụng"
                value={user.totalSpent || 0}
                formatter={(val) => formatNumber(val as number)}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="API Keys"
                value={user.apiKeysCount || 0}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "deposits",
      label: (
        <span>
          <DollarOutlined />
          Lịch sử nạp tiền
        </span>
      ),
      children: (
        <Table
          columns={depositColumns}
          dataSource={depositsData?.deposits || []}
          rowKey="id"
          loading={depositsLoading}
          scroll={{ x: 800 }}
          pagination={{
            current: Math.floor(depositsPage.offset / depositsPage.limit) + 1,
            pageSize: depositsPage.limit,
            total: depositsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn`,
            onChange: (page, pageSize) =>
              setDepositsPage({ limit: pageSize, offset: (page - 1) * pageSize }),
          }}
        />
      ),
    },
    {
      key: "transactions",
      label: (
        <span>
          <HistoryOutlined />
          Lịch sử Token
        </span>
      ),
      children: (
        <Table
          columns={transactionColumns}
          dataSource={transactionsData?.transactions || []}
          rowKey="id"
          loading={transactionsLoading}
          scroll={{ x: 900 }}
          pagination={{
            current: Math.floor(transactionsPage.offset / transactionsPage.limit) + 1,
            pageSize: transactionsPage.limit,
            total: transactionsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`,
            onChange: (page, pageSize) =>
              setTransactionsPage({ limit: pageSize, offset: (page - 1) * pageSize }),
          }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Back button */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ padding: 0, marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Chi tiết User
        </Title>
        <Space>
          <Button icon={<WalletOutlined />} onClick={() => setTopupModalOpen(true)}>
            Nạp Token
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
            Chỉnh sửa
          </Button>
        </Space>
      </div>

      {/* User Info */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Tên">{user.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={user.role === "admin" ? "red" : "blue"}>
              {user.role === "admin" ? "Admin" : "User"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={user.isActive !== false ? "green" : "default"}>
              {user.isActive !== false ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Số dư Token">
            <Text strong style={{ color: "#1890ff" }}>
              {formatNumber(user.tokenBalance)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(user.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Hoạt động gần nhất">
            {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString("vi-VN") : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs items={tabItems} defaultActiveKey="overview" />
      </Card>

      {/* Modals */}
      <TopupModal
        open={topupModalOpen}
        user={user}
        onClose={() => setTopupModalOpen(false)}
      />

      <UserEditModal
        open={editModalOpen}
        user={user}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
}
