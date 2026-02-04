"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Table,
  Tag,
  Statistic,
  Space,
  Spin,
  DatePicker,
  Button,
  Modal,
} from "antd";
import {
  BarChartOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CloudOutlined,
  RobotOutlined,
  ApiOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Types
interface TokenUsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostTokens: number;
}

interface TokenUsageByType extends TokenUsageStats {
  requestType: "chat" | "cronjob" | "api";
}

interface TokenUsageByDate extends TokenUsageStats {
  date: string;
}

interface TokenUsageByUser extends TokenUsageStats {
  userId: string;
  userEmail: string;
  userName: string;
}

interface PlatformStats {
  period: string;
  current: TokenUsageStats;
  previous: TokenUsageStats;
  byType: TokenUsageByType[];
  daily: TokenUsageByDate[];
  topUsers: TokenUsageByUser[];
}

interface UsageRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  requestType: "chat" | "cronjob" | "api";
  requestId: string | null;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costTokens: number;
  createdAt: string;
}

type PeriodType = "today" | "week" | "month" | "year" | "custom";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodType>("today");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // User detail modal state
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TokenUsageByUser | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<{
    stats: TokenUsageStats;
    byType: TokenUsageByType[];
    daily: TokenUsageByDate[];
    history: UsageRecord[];
  } | null>(null);

  // Fetch platform stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/analytics/admin/overview?period=${period}`;
      if (period === "custom" && customRange) {
        url = `/analytics/admin/range?start=${customRange[0].format("YYYY-MM-DD")}&end=${customRange[1].format("YYYY-MM-DD")}`;
      }
      const response = await api.get<PlatformStats>(url);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [period, customRange]);

  // Fetch usage history
  const fetchHistory = useCallback(async (page: number = 1) => {
    setHistoryLoading(true);
    try {
      const response = await api.get<{ records: UsageRecord[]; total: number }>(
        `/analytics/admin/history?limit=10&offset=${(page - 1) * 10}`
      );
      setHistory(response.data.records || []);
      setHistoryTotal(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch user detail stats
  const fetchUserDetail = useCallback(async (userId: string) => {
    setUserDetailLoading(true);
    try {
      // API may return stats as "stats" or "current" depending on version
      const response = await api.get<{
        stats?: TokenUsageStats;
        current?: TokenUsageStats;
        byType: TokenUsageByType[];
        daily: TokenUsageByDate[];
        history?: { records: UsageRecord[]; total: number };
      }>(`/analytics/admin/users/${userId}?period=${period}`);

      // Default stats if not provided
      const defaultStats: TokenUsageStats = {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCostTokens: 0,
      };

      // Support both "stats" and "current" keys from API
      const statsData = response.data.stats || response.data.current || defaultStats;

      setUserDetail({
        stats: statsData,
        byType: response.data.byType || [],
        daily: response.data.daily || [],
        history: response.data.history?.records || [],
      });
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    } finally {
      setUserDetailLoading(false);
    }
  }, [period]);

  // Open user detail modal
  const handleUserClick = (user: TokenUsageByUser) => {
    setSelectedUser(user);
    setUserModalVisible(true);
    fetchUserDetail(user.userId);
  };

  // Close user detail modal
  const handleUserModalClose = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
    setUserDetail(null);
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);

  // Handle period change
  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    if (value !== "custom") {
      setCustomRange(null);
    }
  };

  // Handle custom range change
  const handleRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setCustomRange(dates);
    if (dates) {
      setPeriod("custom");
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate percentage change
  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Request type colors
  const typeColors: Record<string, string> = {
    chat: "blue",
    cronjob: "purple",
    api: "green",
  };

  // Request type icons
  const typeIcons: Record<string, React.ReactNode> = {
    chat: <CloudOutlined />,
    cronjob: <RobotOutlined />,
    api: <ApiOutlined />,
  };

  // Top users columns
  const topUsersColumns: ColumnsType<TokenUsageByUser> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <Text strong>{record.userName || record.userEmail}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.userEmail}
          </Text>
        </div>
      ),
    },
    {
      title: "Requests",
      dataIndex: "totalRequests",
      key: "requests",
      align: "right",
      render: (v) => formatNumber(v),
    },
    {
      title: "Input Tokens",
      dataIndex: "totalInputTokens",
      key: "input",
      align: "right",
      render: (v) => formatNumber(v),
    },
    {
      title: "Output Tokens",
      dataIndex: "totalOutputTokens",
      key: "output",
      align: "right",
      render: (v) => formatNumber(v),
    },
    {
      title: "Total Tokens",
      dataIndex: "totalTokens",
      key: "total",
      align: "right",
      render: (v) => <Text strong>{formatNumber(v)}</Text>,
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleUserClick(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // History columns
  const historyColumns: ColumnsType<UsageRecord> = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      width: 160,
      render: (ts) => dayjs(ts).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "User",
      key: "user",
      width: 180,
      ellipsis: true,
      render: (_, record) => record.userEmail,
    },
    {
      title: "Type",
      dataIndex: "requestType",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color={typeColors[type]} icon={typeIcons[type]}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 180,
      ellipsis: true,
      render: (model) => model || "-",
    },
    {
      title: "Input",
      dataIndex: "inputTokens",
      key: "input",
      width: 100,
      align: "right",
      render: (v) => formatNumber(v),
    },
    {
      title: "Output",
      dataIndex: "outputTokens",
      key: "output",
      width: 100,
      align: "right",
      render: (v) => formatNumber(v),
    },
    {
      title: "Total",
      dataIndex: "totalTokens",
      key: "total",
      width: 100,
      align: "right",
      render: (v) => <Text strong>{formatNumber(v)}</Text>,
    },
  ];

  const current = stats?.current || {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostTokens: 0,
  };

  const previous = stats?.previous || {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostTokens: 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            Token Analytics
          </Title>
          <Text type="secondary">Thống kê sử dụng token theo thời gian</Text>
        </div>
        <Space>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: 140 }}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "week", label: "Tuần này" },
              { value: "month", label: "Tháng này" },
              { value: "year", label: "Năm nay" },
              { value: "custom", label: "Tùy chọn" },
            ]}
          />
          {period === "custom" && (
            <RangePicker
              value={customRange}
              onChange={(dates) => handleRangeChange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="DD/MM/YYYY"
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchHistory(); }}>
            Refresh
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Requests"
                value={current.totalRequests}
                prefix={<ThunderboltOutlined />}
                formatter={(v) => formatNumber(v as number)}
              />
              <div style={{ marginTop: 8 }}>
                {getPercentChange(current.totalRequests, previous.totalRequests) >= 0 ? (
                  <Text type="success">
                    <ArrowUpOutlined /> {Math.abs(getPercentChange(current.totalRequests, previous.totalRequests)).toFixed(1)}%
                  </Text>
                ) : (
                  <Text type="danger">
                    <ArrowDownOutlined /> {Math.abs(getPercentChange(current.totalRequests, previous.totalRequests)).toFixed(1)}%
                  </Text>
                )}
                <Text type="secondary"> vs period trước</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Input Tokens"
                value={current.totalInputTokens}
                styles={{ content: { color: "#1890ff" } }}
                formatter={(v) => formatNumber(v as number)}
              />
              <div style={{ marginTop: 8 }}>
                {getPercentChange(current.totalInputTokens, previous.totalInputTokens) >= 0 ? (
                  <Text type="success">
                    <ArrowUpOutlined /> {Math.abs(getPercentChange(current.totalInputTokens, previous.totalInputTokens)).toFixed(1)}%
                  </Text>
                ) : (
                  <Text type="danger">
                    <ArrowDownOutlined /> {Math.abs(getPercentChange(current.totalInputTokens, previous.totalInputTokens)).toFixed(1)}%
                  </Text>
                )}
                <Text type="secondary"> vs period trước</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Output Tokens"
                value={current.totalOutputTokens}
                styles={{ content: { color: "#52c41a" } }}
                formatter={(v) => formatNumber(v as number)}
              />
              <div style={{ marginTop: 8 }}>
                {getPercentChange(current.totalOutputTokens, previous.totalOutputTokens) >= 0 ? (
                  <Text type="success">
                    <ArrowUpOutlined /> {Math.abs(getPercentChange(current.totalOutputTokens, previous.totalOutputTokens)).toFixed(1)}%
                  </Text>
                ) : (
                  <Text type="danger">
                    <ArrowDownOutlined /> {Math.abs(getPercentChange(current.totalOutputTokens, previous.totalOutputTokens)).toFixed(1)}%
                  </Text>
                )}
                <Text type="secondary"> vs period trước</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Tokens"
                value={current.totalTokens}
                styles={{ content: { color: "#722ed1" } }}
                formatter={(v) => formatNumber(v as number)}
              />
              <div style={{ marginTop: 8 }}>
                {getPercentChange(current.totalTokens, previous.totalTokens) >= 0 ? (
                  <Text type="success">
                    <ArrowUpOutlined /> {Math.abs(getPercentChange(current.totalTokens, previous.totalTokens)).toFixed(1)}%
                  </Text>
                ) : (
                  <Text type="danger">
                    <ArrowDownOutlined /> {Math.abs(getPercentChange(current.totalTokens, previous.totalTokens)).toFixed(1)}%
                  </Text>
                )}
                <Text type="secondary"> vs period trước</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Breakdown by Type */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Phân loại theo Request Type">
              {stats?.byType && stats.byType.length > 0 ? (
                <Table
                  dataSource={stats.byType}
                  rowKey="requestType"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Type",
                      dataIndex: "requestType",
                      render: (type) => (
                        <Tag color={typeColors[type]} icon={typeIcons[type]}>
                          {type}
                        </Tag>
                      ),
                    },
                    {
                      title: "Requests",
                      dataIndex: "totalRequests",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Input",
                      dataIndex: "totalInputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Output",
                      dataIndex: "totalOutputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Total",
                      dataIndex: "totalTokens",
                      align: "right",
                      render: (v) => <Text strong>{formatNumber(v)}</Text>,
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">Chưa có dữ liệu</Text>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Daily Usage (7 ngày gần nhất)">
              {stats?.daily && stats.daily.length > 0 ? (
                <Table
                  dataSource={stats.daily.slice(0, 7)}
                  rowKey="date"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Date",
                      dataIndex: "date",
                      render: (d) => dayjs(d).format("DD/MM"),
                    },
                    {
                      title: "Requests",
                      dataIndex: "totalRequests",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Input",
                      dataIndex: "totalInputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Output",
                      dataIndex: "totalOutputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Total",
                      dataIndex: "totalTokens",
                      align: "right",
                      render: (v) => <Text strong>{formatNumber(v)}</Text>,
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">Chưa có dữ liệu</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Top Users */}
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Top Users</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {stats?.topUsers && stats.topUsers.length > 0 ? (
            <Table
              dataSource={stats.topUsers}
              columns={topUsersColumns}
              rowKey="userId"
              pagination={false}
              size="small"
            />
          ) : (
            <Text type="secondary">Chưa có dữ liệu</Text>
          )}
        </Card>

        {/* Usage History */}
        <Card title="Lịch sử Usage gần đây">
          <Table
            dataSource={history}
            columns={historyColumns}
            rowKey="id"
            loading={historyLoading}
            size="small"
            scroll={{ x: 1000 }}
            pagination={{
              current: historyPage,
              pageSize: 10,
              total: historyTotal,
              showSizeChanger: false,
              onChange: (page) => {
                setHistoryPage(page);
                fetchHistory(page);
              },
            }}
          />
        </Card>
      </Spin>

      {/* User Detail Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Chi tiết User: {selectedUser?.userName || selectedUser?.userEmail}</span>
          </Space>
        }
        open={userModalVisible}
        onCancel={handleUserModalClose}
        footer={null}
        width={900}
      >
        <Spin spinning={userDetailLoading}>
          {userDetail && userDetail.stats && (
            <>
              {/* User Stats */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Statistic
                    title="Requests"
                    value={userDetail.stats.totalRequests || 0}
                    formatter={(v) => formatNumber(v as number)}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Input Tokens"
                    value={userDetail.stats.totalInputTokens || 0}
                    formatter={(v) => formatNumber(v as number)}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Output Tokens"
                    value={userDetail.stats.totalOutputTokens || 0}
                    formatter={(v) => formatNumber(v as number)}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Total Tokens"
                    value={userDetail.stats.totalTokens || 0}
                    formatter={(v) => formatNumber(v as number)}
                  />
                </Col>
              </Row>

              {/* By Type */}
              <Card title="Theo loại Request" size="small" style={{ marginBottom: 16 }}>
                <Table
                  dataSource={userDetail.byType}
                  rowKey="requestType"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Type",
                      dataIndex: "requestType",
                      render: (type) => (
                        <Tag color={typeColors[type]} icon={typeIcons[type]}>
                          {type}
                        </Tag>
                      ),
                    },
                    {
                      title: "Requests",
                      dataIndex: "totalRequests",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Input",
                      dataIndex: "totalInputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Output",
                      dataIndex: "totalOutputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Total",
                      dataIndex: "totalTokens",
                      align: "right",
                      render: (v) => <Text strong>{formatNumber(v)}</Text>,
                    },
                  ]}
                />
              </Card>

              {/* Daily Stats */}
              <Card title="Theo ngày (7 ngày gần nhất)" size="small" style={{ marginBottom: 16 }}>
                <Table
                  dataSource={userDetail.daily.slice(0, 7)}
                  rowKey="date"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Date",
                      dataIndex: "date",
                      render: (d) => dayjs(d).format("DD/MM/YYYY"),
                    },
                    {
                      title: "Requests",
                      dataIndex: "totalRequests",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Input",
                      dataIndex: "totalInputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Output",
                      dataIndex: "totalOutputTokens",
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Total",
                      dataIndex: "totalTokens",
                      align: "right",
                      render: (v) => <Text strong>{formatNumber(v)}</Text>,
                    },
                  ]}
                />
              </Card>

              {/* Recent History */}
              <Card title="Lịch sử gần đây" size="small">
                <Table
                  dataSource={userDetail.history.slice(0, 10)}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Time",
                      dataIndex: "createdAt",
                      width: 140,
                      render: (ts) => dayjs(ts).format("DD/MM HH:mm"),
                    },
                    {
                      title: "Type",
                      dataIndex: "requestType",
                      width: 90,
                      render: (type) => (
                        <Tag color={typeColors[type]} icon={typeIcons[type]}>
                          {type}
                        </Tag>
                      ),
                    },
                    {
                      title: "Model",
                      dataIndex: "model",
                      ellipsis: true,
                      render: (model) => model || "-",
                    },
                    {
                      title: "Input",
                      dataIndex: "inputTokens",
                      width: 80,
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Output",
                      dataIndex: "outputTokens",
                      width: 80,
                      align: "right",
                      render: (v) => formatNumber(v),
                    },
                    {
                      title: "Total",
                      dataIndex: "totalTokens",
                      width: 80,
                      align: "right",
                      render: (v) => <Text strong>{formatNumber(v)}</Text>,
                    },
                  ]}
                />
              </Card>
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
