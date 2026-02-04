"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  Typography,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WalletOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { User, UserFilters } from "@/types";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { TopupModal } from "@/components/users/topup-modal";
import { UserEditModal } from "@/components/users/user-edit-modal";

const { Title } = Typography;

export default function UsersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data, isLoading, refetch } = useUsers(filters);
  const deleteMutation = useDeleteUser();

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  // Handle role filter
  const handleRoleFilter = (role: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      role: role as UserFilters["role"],
      page: 1,
    }));
  };

  // Handle pagination
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 20,
    }));
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Handle topup
  const handleTopup = (user: User) => {
    setSelectedUser(user);
    setTopupModalOpen(true);
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  // Handle view detail
  const handleViewDetail = (id: string) => {
    router.push(`/admin/users/${id}`);
  };

  // Format number
  const formatNumber = (value: number | undefined) => {
    if (value === undefined) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 150,
      ellipsis: true,
      render: (name) => name || "-",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "Admin" : "User"}
        </Tag>
      ),
    },
    {
      title: "Số dư Token",
      dataIndex: "tokenBalance",
      key: "tokenBalance",
      width: 150,
      align: "right",
      render: (balance) => (
        <span style={{ fontWeight: 500, color: "#1890ff" }}>
          {formatNumber(balance)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive) => (
        <Tag color={isActive !== false ? "green" : "default"}>
          {isActive !== false ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<WalletOutlined />}
            onClick={() => handleTopup(record)}
            title="Nạp token"
            style={{ color: "#52c41a" }}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa user"
            description="Bạn có chắc chắn muốn xóa user này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
              loading={deleteMutation.isPending}
            />
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
          Quản lý Users
        </Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm theo email hoặc tên"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Vai trò"
              style={{ width: "100%" }}
              allowClear
              value={filters.role}
              onChange={handleRoleFilter}
            >
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10} lg={14}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.users || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} users`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modals */}
      <TopupModal
        open={topupModalOpen}
        user={selectedUser}
        onClose={() => {
          setTopupModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <UserEditModal
        open={editModalOpen}
        user={selectedUser}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
