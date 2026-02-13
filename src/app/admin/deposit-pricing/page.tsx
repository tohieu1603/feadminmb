"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  Button,
  Spin,
  Space,
  Popconfirm,
} from "antd";
import {
  DollarOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DepositPackage } from "@/types";
import { useDepositPricing, useUpdateDepositPricing } from "@/hooks/use-deposit-pricing";
import { PricingConfigModal } from "@/components/deposit-pricing/pricing-config-modal";
import { PackageFormModal } from "@/components/deposit-pricing/package-form-modal";

const { Title } = Typography;

const formatNumber = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function DepositPricingPage() {
  const { data, isLoading, refetch } = useDepositPricing();
  const updatePricing = useUpdateDepositPricing();

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<DepositPackage | null>(null);

  // Save config (pricePerMillion, minimumTokens, minimumVnd)
  const handleSaveConfig = (values: { pricePerMillion: number; minimumTokens: number; minimumVnd: number }) => {
    if (!data) return;
    updatePricing.mutate(
      { ...data, ...values },
      { onSuccess: () => setConfigModalOpen(false) }
    );
  };

  // Add or update a package
  const handleSavePackage = (pkg: DepositPackage) => {
    if (!data) return;
    let newPackages: DepositPackage[];
    if (editingPackage) {
      // Update existing
      newPackages = data.packages.map((p) => (p.id === editingPackage.id ? pkg : p));
    } else {
      // Add new
      newPackages = [...data.packages, pkg];
    }
    updatePricing.mutate(
      { ...data, packages: newPackages },
      {
        onSuccess: () => {
          setPackageModalOpen(false);
          setEditingPackage(null);
        },
      }
    );
  };

  // Delete a package
  const handleDeletePackage = (id: string) => {
    if (!data) return;
    const newPackages = data.packages.filter((p) => p.id !== id);
    updatePricing.mutate({ ...data, packages: newPackages });
  };

  const handleEditPackage = (pkg: DepositPackage) => {
    setEditingPackage(pkg);
    setPackageModalOpen(true);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setPackageModalOpen(true);
  };

  const columns: ColumnsType<DepositPackage> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => <code>{id}</code>,
    },
    {
      title: "Gói",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <span style={{ fontWeight: 500 }}>
          {name} {record.popular && <Tag color="gold">Popular</Tag>}
        </span>
      ),
    },
    {
      title: "Tokens",
      dataIndex: "tokens",
      key: "tokens",
      align: "right",
      render: (tokens) => (
        <span style={{ color: "#1890ff", fontWeight: 500 }}>{formatNumber(tokens)}</span>
      ),
    },
    {
      title: "Giá (VND)",
      dataIndex: "priceVnd",
      key: "priceVnd",
      align: "right",
      render: (price) => `${formatNumber(price)} ₫`,
    },
    {
      title: "Bonus",
      dataIndex: "bonus",
      key: "bonus",
      align: "right",
      render: (bonus) =>
        bonus > 0 ? (
          <span style={{ color: "#52c41a", fontWeight: 500 }}>+{formatNumber(bonus)}</span>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    {
      title: "Tổng nhận",
      key: "totalReceive",
      align: "right",
      render: (_, record) => (
        <span style={{ color: "#722ed1", fontWeight: 600 }}>
          {formatNumber(record.tokens + record.bonus)}
        </span>
      ),
    },
    {
      title: "Đơn giá / 1M",
      key: "unitPrice",
      align: "right",
      render: (_, record) => {
        const effective = record.tokens + record.bonus;
        const perMillion = Math.round((record.priceVnd / effective) * 1_000_000);
        return `${formatNumber(perMillion)} ₫`;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPackage(record)} />
          <Popconfirm
            title={`Xoá gói "${record.name}"?`}
            onConfirm={() => handleDeletePackage(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Bảng giá Deposit</Title>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setConfigModalOpen(true)}>
            Cấu hình
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Config overview */}
      {data && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Giá / 1M Tokens"
                value={data.pricePerMillion}
                formatter={(val) => `${formatNumber(val as number)} ₫`}
                prefix={<DollarOutlined />}
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Token tối thiểu"
                value={data.minimumTokens}
                formatter={(val) => formatNumber(val as number)}
                prefix={<ThunderboltOutlined />}
                styles={{ content: { color: "#722ed1" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Nạp tối thiểu"
                value={data.minimumVnd}
                formatter={(val) => `${formatNumber(val as number)} ₫`}
                prefix={<DollarOutlined />}
                styles={{ content: { color: "#faad14" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Số gói"
                value={data.packages?.length || 0}
                prefix={<GiftOutlined />}
                styles={{ content: { color: "#52c41a" } }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Packages table */}
      <Card
        title="Các gói nạp"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPackage}>
            Thêm gói
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.packages || []}
          rowKey="id"
          pagination={false}
          loading={updatePricing.isPending}
          rowClassName={(record) => (record.popular ? "ant-table-row-selected" : "")}
        />
      </Card>

      {/* Config Modal */}
      <PricingConfigModal
        open={configModalOpen}
        initialValues={
          data
            ? {
                pricePerMillion: data.pricePerMillion,
                minimumTokens: data.minimumTokens,
                minimumVnd: data.minimumVnd,
              }
            : null
        }
        onSave={handleSaveConfig}
        onClose={() => setConfigModalOpen(false)}
        loading={updatePricing.isPending}
      />

      {/* Package Form Modal */}
      <PackageFormModal
        open={packageModalOpen}
        pkg={editingPackage}
        onSave={handleSavePackage}
        onClose={() => {
          setPackageModalOpen(false);
          setEditingPackage(null);
        }}
      />
    </div>
  );
}
