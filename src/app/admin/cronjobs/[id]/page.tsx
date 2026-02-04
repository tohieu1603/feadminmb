"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Table,
  Typography,
  Space,
  Spin,
  Empty,
  Tabs,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { CronjobExecution } from "@/types";
import { useCronjob, useCronjobExecutions } from "@/hooks/use-cronjobs";

const { Title, Text, Paragraph } = Typography;

export default function CronjobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cronjobId = params.id as string;

  const [execPage, setExecPage] = useState({ limit: 20, offset: 0 });

  const { data: cronjob, isLoading: cronjobLoading } = useCronjob(cronjobId);
  const { data: execData, isLoading: execLoading } = useCronjobExecutions(
    cronjobId,
    execPage.limit,
    execPage.offset
  );

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN");
  };

  // Format duration
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Execution columns
  const executionColumns: ColumnsType<CronjobExecution> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      ellipsis: true,
      render: (id) => <Text copyable={{ text: id }}>{id.slice(0, 12)}...</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          running: { color: "processing", icon: <SyncOutlined spin /> },
          success: { color: "success", icon: <CheckCircleOutlined /> },
          failure: { color: "error", icon: <CloseCircleOutlined /> },
        };
        const { color, icon } = config[status] || { color: "default", icon: null };
        return (
          <Tag color={color} icon={icon}>
            {status === "running" ? "Đang chạy" : status === "success" ? "Thành công" : "Thất bại"}
          </Tag>
        );
      },
    },
    {
      title: "Bắt đầu",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 180,
      render: formatDate,
    },
    {
      title: "Kết thúc",
      dataIndex: "finishedAt",
      key: "finishedAt",
      width: 180,
      render: formatDate,
    },
    {
      title: "Thời gian",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 100,
      render: formatDuration,
    },
    {
      title: "Output / Error",
      key: "result",
      ellipsis: true,
      render: (_, record) => {
        if (record.error) {
          return <Text type="danger">{record.error}</Text>;
        }
        if (record.output) {
          return <Text>{record.output.slice(0, 100)}...</Text>;
        }
        return "-";
      },
    },
  ];

  if (cronjobLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!cronjob) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Empty description="Không tìm thấy cronjob" />
        <Button type="link" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <ClockCircleOutlined />
          Thông tin
        </span>
      ),
      children: (
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="ID">{cronjob.id}</Descriptions.Item>
          <Descriptions.Item label="Tên">{cronjob.name}</Descriptions.Item>
          <Descriptions.Item label="User">
            {cronjob.userName || cronjob.userEmail || cronjob.customerId}
          </Descriptions.Item>
          <Descriptions.Item label="Schedule">
            <Tag icon={<ClockCircleOutlined />}>{cronjob.schedule}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {cronjob.enabled ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Đang bật
              </Tag>
            ) : (
              <Tag color="default" icon={<CloseCircleOutlined />}>
                Đang tắt
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Lần chạy cuối">{formatDate(cronjob.lastRunAt)}</Descriptions.Item>
          <Descriptions.Item label="Lần chạy tiếp">
            {cronjob.nextRunAt ? (
              <Tag color="blue" icon={<SyncOutlined />}>
                {formatDate(cronjob.nextRunAt)}
              </Tag>
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDate(cronjob.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Task/Action" span={2}>
            <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {cronjob.task || cronjob.action || "-"}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "executions",
      label: (
        <span>
          <HistoryOutlined />
          Lịch sử chạy ({execData?.total || 0})
        </span>
      ),
      children: (
        <Table
          columns={executionColumns}
          dataSource={execData?.executions || []}
          rowKey="id"
          loading={execLoading}
          scroll={{ x: 900 }}
          pagination={{
            current: Math.floor(execPage.offset / execPage.limit) + 1,
            pageSize: execPage.limit,
            total: execData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lần chạy`,
            onChange: (page, pageSize) =>
              setExecPage({ limit: pageSize, offset: (page - 1) * pageSize }),
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 16 }}>
                {record.output && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Output:</Text>
                    <Paragraph
                      style={{
                        background: "#f5f5f5",
                        padding: 12,
                        borderRadius: 4,
                        whiteSpace: "pre-wrap",
                        maxHeight: 300,
                        overflow: "auto",
                      }}
                    >
                      {record.output}
                    </Paragraph>
                  </div>
                )}
                {record.error && (
                  <div>
                    <Text strong type="danger">
                      Error:
                    </Text>
                    <Paragraph
                      style={{
                        background: "#fff1f0",
                        padding: 12,
                        borderRadius: 4,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {record.error}
                    </Paragraph>
                  </div>
                )}
              </div>
            ),
            rowExpandable: (record) => !!record.output || !!record.error,
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
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          {cronjob.name}
        </Title>
        <Space>
          <Button icon={<PlayCircleOutlined />} disabled>
            Chạy ngay
          </Button>
        </Space>
      </div>

      {/* Content */}
      <Card>
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>
    </div>
  );
}
