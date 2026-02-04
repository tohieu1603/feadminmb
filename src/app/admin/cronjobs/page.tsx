"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { Cronjob, CronjobFilters } from "@/types";
import { useCronjobs } from "@/hooks/use-cronjobs";

const { Title } = Typography;

export default function CronjobsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<CronjobFilters>({
    limit: 20,
    offset: 0,
  });

  const { data, isLoading } = useCronjobs(filters);

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN");
  };

  // Columns
  const columns: ColumnsType<Cronjob> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: 12, color: "#888" }}>{record.id.slice(0, 8)}...</span>
        </Space>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.userName || "-"}</span>
          <span style={{ fontSize: 12, color: "#888" }}>{record.userEmail}</span>
        </Space>
      ),
    },
    {
      title: "Schedule",
      dataIndex: "schedule",
      key: "schedule",
      width: 130,
      render: (schedule) => (
        <Tooltip title={schedule}>
          <Tag icon={<ClockCircleOutlined />}>{schedule}</Tag>
        </Tooltip>
      ),
    },
    {
      title: "Task",
      dataIndex: "action",
      key: "action",
      ellipsis: true,
      render: (action, record) => (
        <Tooltip title={record.task || action}>
          <span>{record.task || action || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      align: "center",
      render: (enabled) =>
        enabled ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Bật
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            Tắt
          </Tag>
        ),
    },
    {
      title: "Lần chạy cuối",
      dataIndex: "lastRunAt",
      key: "lastRunAt",
      width: 160,
      render: formatDate,
    },
    {
      title: "Lần chạy tiếp",
      dataIndex: "nextRunAt",
      key: "nextRunAt",
      width: 160,
      render: (date) =>
        date ? (
          <Tag color="blue" icon={<SyncOutlined />}>
            {formatDate(date)}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/admin/cronjobs/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // Handle table change
  const handleTableChange = (pagination: TablePaginationConfig) => {
    const newOffset = ((pagination.current || 1) - 1) * (pagination.pageSize || 20);
    setFilters((prev) => ({
      ...prev,
      limit: pagination.pageSize || 20,
      offset: newOffset,
    }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Quản lý Cronjobs
        </Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo User ID..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  userId: e.target.value || undefined,
                  offset: 0,
                }));
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: "100%" }}
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  enabled: value,
                  offset: 0,
                }));
              }}
              options={[
                { value: true, label: "Đang bật" },
                { value: false, label: "Đang tắt" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.cronjobs || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
            pageSize: filters.limit || 20,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} cronjobs`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}
