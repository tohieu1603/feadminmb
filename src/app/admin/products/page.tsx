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
  Typography,
  Row,
  Col,
  Image,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Product, ProductFilters } from "@/types";
import { useProducts, useDeleteProduct, useProductCategories } from "@/hooks/use-products";

const { Title } = Typography;

const formatNumber = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function ProductsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ProductFilters>({ limit: 20, offset: 0 });
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, refetch } = useProducts(filters);
  const { data: categories } = useProductCategories();
  const deleteProduct = useDeleteProduct();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchText || undefined, offset: 0 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, limit: pageSize, offset: (page - 1) * pageSize }));
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      width: 70,
      render: (url) =>
        url ? (
          <Image src={url} width={50} height={50} style={{ objectFit: "cover", borderRadius: 4 }} alt="" />
        ) : (
          <div style={{ width: 50, height: 50, background: "#f0f0f0", borderRadius: 4 }} />
        ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name, record) => (
        <a onClick={() => router.push(`/admin/products/${record.slug}`)}>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{record.slug}</div>
        </a>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 130,
      align: "right",
      render: (price) => `${formatNumber(price)} ₫`,
    },
    {
      title: "Kho",
      dataIndex: "stock",
      key: "stock",
      width: 80,
      align: "center",
      render: (stock) => (
        <span style={{ color: stock === 0 ? "#f5222d" : undefined }}>{stock}</span>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (cat) => cat ? <Tag>{cat}</Tag> : "-",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      width: 100,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 80,
      align: "center",
      render: (r) => <span style={{ color: "#faad14" }}>{r}</span>,
    },
    {
      title: "Token Bonus",
      dataIndex: "tokenBonus",
      key: "tokenBonus",
      width: 120,
      align: "right",
      render: (v) => (v ? <span style={{ color: "#52c41a" }}>{formatNumber(v)}</span> : "-"),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/products/${record.slug}`)}
          />
          <Popconfirm
            title="Xoá sản phẩm này?"
            onConfirm={() => deleteProduct.mutate(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý Sản phẩm</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/products/new")}>
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Danh mục"
              style={{ width: "100%" }}
              allowClear
              value={filters.category}
              onChange={(val) => setFilters((prev) => ({ ...prev, category: val, offset: 0 }))}
            >
              {categories?.map((cat: string) => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Sắp xếp"
              style={{ width: "100%" }}
              allowClear
              value={filters.sort}
              onChange={(val) => setFilters((prev) => ({ ...prev, sort: val, offset: 0 }))}
            >
              <Select.Option value="newest">Mới nhất</Select.Option>
              <Select.Option value="price_asc">Giá tăng</Select.Option>
              <Select.Option value="price_desc">Giá giảm</Select.Option>
              <Select.Option value="rating">Rating</Select.Option>
              <Select.Option value="name">Tên A-Z</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.products || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
            pageSize: filters.limit || 20,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            onChange: handlePageChange,
          }}
        />
      </Card>
    </div>
  );
}
