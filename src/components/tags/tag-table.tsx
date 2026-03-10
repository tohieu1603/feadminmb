"use client";

import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Switch,
  Tooltip,
  Popconfirm,
  Input,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Tag } from "@/types";
import { useTags, useDeleteTag, useToggleTagActive } from "@/hooks/use-tags";

const { Text } = Typography;

interface TagTableProps {
  onAdd: () => void;
  onEdit: (tag: Tag) => void;
}

export function TagTable({ onAdd, onEdit }: TagTableProps) {
  const [search, setSearch] = useState("");
  const { data: tags = [], isLoading } = useTags({ search: search || undefined });
  const deleteMutation = useDeleteTag();
  const toggleMutation = useToggleTagActive();

  const columns: ColumnsType<Tag> = [
    {
      title: "Tên tag",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <Space>
          {record.color && (
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: record.color,
                flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          )}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug: string) => (
        <Text code style={{ fontSize: 12 }}>
          {slug}
        </Text>
      ),
    },
    {
      title: "Màu",
      dataIndex: "color",
      key: "color",
      width: 100,
      render: (color: string | null) =>
        color ? (
          <Space size={6}>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: 3,
                backgroundColor: color,
                border: "1px solid rgba(0,0,0,0.15)",
              }}
            />
            <Text style={{ fontSize: 12 }}>{color}</Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          loading={toggleMutation.isPending}
          onChange={() => toggleMutation.mutate(record.id)}
          checkedChildren="Hiện"
          unCheckedChildren="Ẩn"
          size="small"
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa tag"
            description="Bạn có chắc muốn xóa tag này không?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: "space-between", width: "100%" }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm tag
        </Button>
      </Space>

      <Table<Tag>
        columns={columns}
        dataSource={tags}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Tổng ${total} tags` }}
        size="middle"
      />
    </div>
  );
}
