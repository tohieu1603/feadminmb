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
  Avatar,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Author } from "@/types";
import {
  useAuthors,
  useDeleteAuthor,
  useToggleAuthorActive,
  useToggleAuthorFeatured,
} from "@/hooks/use-authors";

const { Text } = Typography;

interface AuthorTableProps {
  onAdd: () => void;
  onEdit: (author: Author) => void;
}

export function AuthorTable({ onAdd, onEdit }: AuthorTableProps) {
  const [search, setSearch] = useState("");
  const { data: authors = [], isLoading } = useAuthors({ search: search || undefined });
  const deleteMutation = useDeleteAuthor();
  const toggleActiveMutation = useToggleAuthorActive();
  const toggleFeaturedMutation = useToggleAuthorFeatured();

  const columns: ColumnsType<Author> = [
    {
      title: "Tác giả",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatarUrl}
            icon={!record.avatarUrl ? <UserOutlined /> : undefined}
            size={36}
          />
          <div>
            <Text strong>{record.name}</Text>
            {record.jobTitle && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.jobTitle}
                  {record.company && ` @ ${record.company}`}
                </Text>
              </div>
            )}
          </div>
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
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string | null) =>
        email ? <Text style={{ fontSize: 12 }}>{email}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 90,
      align: "center",
      render: (isFeatured: boolean, record) => (
        <Tooltip title={isFeatured ? "Bỏ nổi bật" : "Đặt nổi bật"}>
          <Button
            type="text"
            size="small"
            icon={isFeatured ? <StarFilled style={{ color: "#faad14" }} /> : <StarOutlined />}
            loading={toggleFeaturedMutation.isPending}
            onClick={() => toggleFeaturedMutation.mutate(record.id)}
          />
        </Tooltip>
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
          loading={toggleActiveMutation.isPending}
          onChange={() => toggleActiveMutation.mutate(record.id)}
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
            title="Xóa tác giả"
            description="Bạn có chắc muốn xóa tác giả này không?"
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
          placeholder="Tìm tác giả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm tác giả
        </Button>
      </Space>

      <Table<Author>
        columns={columns}
        dataSource={authors}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Tổng ${total} tác giả` }}
        size="middle"
      />
    </div>
  );
}
