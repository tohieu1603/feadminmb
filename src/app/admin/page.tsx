"use client";

import { Row, Col, Typography, Card, Spin } from "antd";
import {
  UserOutlined,
  DollarOutlined,
  WalletOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentDeposits, RecentTransactions } from "@/components/dashboard/recent-activities";
import { useDashboardStats, useRecentDeposits, useRecentTransactions } from "@/hooks/use-dashboard";

const { Title } = Typography;

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentDeposits, isLoading: depositsLoading } = useRecentDeposits(5);
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions(5);

  // Format number with commas
  const formatNumber = (value: number | string | undefined) => {
    if (value === undefined) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Tổng Users"
            value={stats?.totalUsers || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: "#1890ff" }}
            loading={statsLoading}
            formatter={formatNumber}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Doanh thu (VND)"
            value={stats?.totalRevenue || 0}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#52c41a" }}
            loading={statsLoading}
            formatter={formatNumber}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Tổng Deposits"
            value={stats?.totalDeposits || 0}
            prefix={<WalletOutlined />}
            valueStyle={{ color: "#722ed1" }}
            loading={statsLoading}
            formatter={formatNumber}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Đơn chờ xử lý"
            value={stats?.pendingDeposits || 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#faad14" }}
            loading={statsLoading}
            formatter={formatNumber}
          />
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <RecentDeposits deposits={recentDeposits || []} loading={depositsLoading} />
        </Col>
        <Col xs={24} lg={12}>
          <RecentTransactions
            transactions={recentTransactions || []}
            loading={transactionsLoading}
          />
        </Col>
      </Row>
    </div>
  );
}
