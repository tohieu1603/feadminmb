"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Space,
  Typography,
  message,
  Row,
  Col,
  Tag,
  Table,
  Statistic,
  InputNumber,
  Popconfirm,
  Modal,
} from "antd";
import {
  RocketOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Types matching Operis API
interface SchedulerStatus {
  running: boolean;
  interval: number;
}

interface Cronjob {
  id: string;
  boxId: string | null;
  customerId: string;
  name: string;
  schedule: string; // cron expression string
  action: string;
  task: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

interface CronjobExecution {
  id: string;
  cronjobId: string;
  status: "success" | "failure";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  output: string | null;
  error: string | null;
}

// Schedule type options
type ScheduleType = "every" | "cron";
type TimeUnit = "minutes" | "hours" | "days";

export default function GatewayJobsPage() {
  const [form] = Form.useForm();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [jobs, setJobs] = useState<Cronjob[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("every");
  const [executionsModal, setExecutionsModal] = useState<{
    visible: boolean;
    jobId: string;
    jobName: string;
    executions: CronjobExecution[];
  }>({
    visible: false,
    jobId: "",
    jobName: "",
    executions: [],
  });

  // Fetch scheduler status (admin endpoint)
  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<SchedulerStatus>("/cron/scheduler/status");
      setStatus(response.data);
    } catch {
      // Status fetch failed silently (might not be admin)
    }
  }, []);

  // Fetch jobs list
  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const response = await api.get<{ cronjobs: Cronjob[]; total: number }>("/cron");
      setJobs(response.data.cronjobs || []);
    } catch {
      message.error("Không thể tải danh sách jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchJobs();
  }, [fetchStatus, fetchJobs]);

  // Refresh all
  const handleRefresh = () => {
    fetchStatus();
    fetchJobs();
  };

  // Toggle job enabled/disabled
  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      await api.post(`/cron/${id}/toggle`, { enabled: !currentEnabled });
      message.success(currentEnabled ? "Đã tắt job" : "Đã bật job");
      fetchJobs();
    } catch {
      message.error("Không thể thay đổi trạng thái job");
    }
  };

  // Run job manually
  const handleRun = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.post<CronjobExecution>(`/cron/${id}/run`);
      if (response.data.status === "success") {
        message.success("Job đã chạy thành công");
      } else {
        message.warning(`Job thất bại: ${response.data.error || "Unknown error"}`);
      }
      fetchJobs();
    } catch {
      message.error("Không thể chạy job");
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cron/${id}`);
      message.success("Đã xóa job");
      fetchJobs();
    } catch {
      message.error("Không thể xóa job");
    }
  };

  // View job executions
  const handleViewExecutions = async (job: Cronjob) => {
    try {
      const response = await api.get<{ executions: CronjobExecution[]; total: number }>(
        `/cron/${job.id}/executions?limit=20`
      );
      setExecutionsModal({
        visible: true,
        jobId: job.id,
        jobName: job.name,
        executions: response.data.executions || [],
      });
    } catch {
      message.error("Không thể tải lịch sử chạy");
    }
  };

  // Create new job
  const handleCreate = async (values: {
    name: string;
    enabled: boolean;
    scheduleType: ScheduleType;
    everyValue?: number;
    everyUnit?: TimeUnit;
    cronExpression?: string;
    action?: string;
  }) => {
    setCreateLoading(true);
    try {
      // Build cron expression string
      let schedule: string;
      if (values.scheduleType === "every") {
        const value = values.everyValue || 30;
        const unit = values.everyUnit || "minutes";
        // Convert to cron expression
        if (unit === "minutes") {
          schedule = value === 1 ? "* * * * *" : `*/${value} * * * *`;
        } else if (unit === "hours") {
          schedule = value === 1 ? "0 * * * *" : `0 */${value} * * *`;
        } else {
          // days - run at midnight
          schedule = value === 1 ? "0 0 * * *" : `0 0 */${value} * *`;
        }
      } else {
        schedule = values.cronExpression || "0 9 * * *";
      }

      await api.post("/cron", {
        name: values.name,
        schedule,
        action: values.action || "Scheduled task",
        task: values.action || "Scheduled task",
        enabled: values.enabled,
      });

      message.success("Đã tạo job mới");
      form.resetFields();
      fetchJobs();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      message.error(axiosError.response?.data?.error || "Không thể tạo job");
    } finally {
      setCreateLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN");
  };

  // Format relative time
  const formatRelative = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "overdue";
    if (diff < 60000) return "< 1m";
    if (diff < 3600000) return `in ${Math.round(diff / 60000)}m`;
    if (diff < 86400000) return `in ${Math.round(diff / 3600000)}h`;

    return date.toLocaleString("vi-VN");
  };

  // Jobs table columns
  const columns: ColumnsType<Cronjob> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.action && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.action.substring(0, 50)}
              {record.action.length > 50 ? "..." : ""}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Schedule",
      dataIndex: "schedule",
      key: "schedule",
      width: 150,
      render: (schedule: string) => <Tag color="blue">{schedule}</Tag>,
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={record.enabled ? "green" : "default"}>
          {record.enabled ? "enabled" : "disabled"}
        </Tag>
      ),
    },
    {
      title: "Next Run",
      key: "nextRunAt",
      width: 140,
      render: (_, record) => formatRelative(record.nextRunAt),
    },
    {
      title: "Last Run",
      key: "lastRunAt",
      width: 160,
      render: (_, record) => formatDate(record.lastRunAt),
    },
    {
      title: "Actions",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type={record.enabled ? "default" : "primary"}
            icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggle(record.id, record.enabled)}
          >
            {record.enabled ? "Disable" : "Enable"}
          </Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleRun(record.id)}
            loading={loading}
          >
            Run
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewExecutions(record)}
          >
            History
          </Button>
          <Popconfirm
            title="Xóa job này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          Gateway Jobs
        </Title>
        <Text type="secondary">Quản lý Cron Jobs - Lên lịch tác vụ tự động</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Status & Jobs List */}
        <Col xs={24} lg={14}>
          {/* Scheduler Status */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24} align="middle">
              <Col>
                <Statistic
                  title="SCHEDULER"
                  value={status?.running ? "Running" : "Stopped"}
                  valueStyle={{ color: status?.running ? "#52c41a" : "#ff4d4f" }}
                />
              </Col>
              <Col>
                <Statistic title="JOBS" value={jobs.length} />
              </Col>
              <Col>
                <Statistic
                  title="INTERVAL"
                  value={status?.interval ? `${status.interval / 1000}s` : "-"}
                />
              </Col>
              <Col flex="auto" style={{ textAlign: "right" }}>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Jobs List */}
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <span>Jobs</span>
                <Tag>{jobs.length}</Tag>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={jobs}
              rowKey="id"
              loading={jobsLoading}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        {/* Right Column - New Job Form */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <PlusOutlined />
                <span>New Job</span>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreate}
              initialValues={{
                enabled: true,
                scheduleType: "every",
                everyValue: 30,
                everyUnit: "minutes",
                cronExpression: "0 9 * * *",
              }}
            >
              {/* Name */}
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Nhập tên job" }]}
              >
                <Input placeholder="My Daily Report" />
              </Form.Item>

              {/* Enabled */}
              <Form.Item name="enabled" label="Enabled" valuePropName="checked">
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>

              {/* Schedule Type */}
              <Form.Item name="scheduleType" label="Schedule Type">
                <Select onChange={(v) => setScheduleType(v)}>
                  <Select.Option value="every">Every X (simple)</Select.Option>
                  <Select.Option value="cron">Cron Expression</Select.Option>
                </Select>
              </Form.Item>

              {/* Every X Unit */}
              {scheduleType === "every" && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="everyValue" label="Every">
                      <InputNumber min={1} max={999} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="everyUnit" label="Unit">
                      <Select>
                        <Select.Option value="minutes">Minutes</Select.Option>
                        <Select.Option value="hours">Hours</Select.Option>
                        <Select.Option value="days">Days</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* Cron Expression */}
              {scheduleType === "cron" && (
                <Form.Item
                  name="cronExpression"
                  label="Cron Expression"
                  tooltip="Format: minute hour day month weekday (e.g., 0 9 * * * = 9AM daily)"
                  rules={[{ required: true, message: "Nhập cron expression" }]}
                >
                  <Input placeholder="0 9 * * *" />
                </Form.Item>
              )}

              {/* Action/Task */}
              <Form.Item
                name="action"
                label="Task"
                rules={[{ required: true, message: "Nhập nội dung task" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Ví dụ: Kiểm tra tin nhắn Zalo mới và trả lời tự động nếu cần"
                />
              </Form.Item>

              {/* Submit */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={createLoading}
                  block
                  size="large"
                >
                  Add job
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Executions Modal */}
      <Modal
        title={`Run History: ${executionsModal.jobName}`}
        open={executionsModal.visible}
        onCancel={() => setExecutionsModal({ ...executionsModal, visible: false })}
        footer={null}
        width={700}
      >
        {executionsModal.executions.length === 0 ? (
          <Text type="secondary">Chưa có lịch sử chạy</Text>
        ) : (
          <Table
            dataSource={executionsModal.executions}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              {
                title: "Time",
                dataIndex: "startedAt",
                width: 160,
                render: (ts) => formatDate(ts),
              },
              {
                title: "Status",
                dataIndex: "status",
                width: 100,
                render: (status) => (
                  <Tag
                    color={status === "success" ? "green" : "red"}
                    icon={status === "success" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  >
                    {status}
                  </Tag>
                ),
              },
              {
                title: "Duration",
                dataIndex: "durationMs",
                width: 100,
                render: (ms) => (ms ? `${(ms / 1000).toFixed(1)}s` : "-"),
              },
              {
                title: "Output / Error",
                key: "result",
                ellipsis: true,
                render: (_, record) => (
                  <Text type={record.error ? "danger" : undefined}>
                    {record.error || record.output?.substring(0, 100) || "-"}
                  </Text>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
