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
  Tag,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Category } from "@/types";
import { useCategoryTree, useDeleteCategory, useToggleCategoryActive } from "@/hooks/use-categories";

const { Text } = Typography;

interface CategoryTreeTableProps {
  onAdd: () => void;
  onEdit: (category: Category) => void;
}

function hasChildren(category: Category): boolean {
  return !!(category.children && category.children.length > 0);
}

export function CategoryTreeTable({ onAdd, onEdit }: CategoryTreeTableProps) {
  const [search, setSearch] = useState("");
  const { data: treeData = [], isLoading } = useCategoryTree();
  const deleteMutation = useDeleteCategory();
  const toggleMutation = useToggleCategoryActive();

  // Simple client-side search: filter top-level nodes by name match (also shows subtree)
  const filterTree = (nodes: Category[], term: string): Category[] => {
    if (!term) return nodes;
    return nodes.reduce<Category[]>((acc, node) => {
      const children = filterTree(node.children ?? [], term);
      if (node.name.toLowerCase().includes(term.toLowerCase()) || children.length > 0) {
        acc.push({ ...node, children });
      }
      return acc;
    }, []);
  };

  const filtered = filterTree(treeData, search);

  const columns: ColumnsType<Category> = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.level > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cấp {record.level}
            </Text>
          )}
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
      title: "Thứ tự",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      align: "center",
      render: (val: number) => <Tag>{val}</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => {
        const canDelete = !hasChildren(record);
        return (
          <Space size={4}>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
            <Tooltip title={canDelete ? "Xóa" : "Không thể xóa danh mục có danh mục con"}>
              <Popconfirm
                title="Xóa danh mục"
                description="Bạn có chắc muốn xóa danh mục này không?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                disabled={!canDelete}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!canDelete}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: "space-between", width: "100%" }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm danh mục..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm danh mục
        </Button>
      </Space>

      <Table<Category>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        childrenColumnName="children"
        pagination={false}
        size="middle"
        expandable={{
          defaultExpandAllRows: false,
        }}
      />
    </div>
  );
}
