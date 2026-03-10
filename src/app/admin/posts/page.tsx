"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, Button, Space, Input, Tag, Typography, Popconfirm, App,
} from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { usePosts, useDeletePost } from "@/hooks/use-posts";
import type { Post, PostFilters } from "@/types";
import dayjs from "dayjs";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  draft: "default",
  published: "green",
  archived: "orange",
};

export default function PostsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<PostFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = usePosts(filters);
  const deletePost = useDeletePost();

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
    } catch {
      // error handled in hook
    }
  };

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search, page: 1 }));
  };

  const columns = [
    { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true, width: 300 },
    { title: "Slug", dataIndex: "slug", key: "slug", ellipsis: true, width: 200 },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s: string) => <Tag color={statusColors[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 90,
      render: (v: number) => (v ?? 0).toLocaleString(),
    },
    {
      title: "Nổi bật",
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 80,
      render: (v: boolean) => v ? <Tag color="gold">Yes</Tag> : "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: unknown, record: Post) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/posts/${record.id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm title="Xóa bài viết này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Bài viết</Title>
        <Space>
          <Input
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => router.push("/admin/posts/create")}
          >
            Tạo bài viết
          </Button>
        </Space>
      </div>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: data?.pagination?.total || 0,
          showTotal: (total) => `Tổng ${total} bài viết`,
          onChange: (page, pageSize) => {
            setFilters((f) => ({ ...f, page, limit: pageSize }));
          },
        }}
      />
    </div>
  );
}
