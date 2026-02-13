"use client";

import { Card, Tag, Typography, Empty, Spin } from "antd";
import { DollarOutlined, WalletOutlined } from "@ant-design/icons";
import type { Deposit, TokenTransaction } from "@/types";

const { Text } = Typography;

interface RecentDepositsProps {
  deposits: Deposit[];
  loading?: boolean;
}

export function RecentDeposits({ deposits, loading }: RecentDepositsProps) {
  const formatNumber = (value: number | undefined | null) => {
    if (value == null) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      completed: "green",
      cancelled: "red",
      expired: "default",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ",
      completed: "Xong",
      cancelled: "Hủy",
      expired: "Hết hạn",
    };
    return labels[status] || status;
  };

  return (
    <Card
      title={
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Nạp tiền gần đây
        </span>
      }
      size="small"
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Spin />
        </div>
      ) : deposits.length === 0 ? (
        <Empty description="Chưa có đơn nạp" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div>
          {deposits.map((item) => (
            <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text ellipsis style={{ maxWidth: 150 }}>
                  {item.userEmail || item.userId}
                </Text>
                <Tag color={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatNumber(item.amount)} VND
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface RecentTransactionsProps {
  transactions: TokenTransaction[];
  loading?: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  const formatNumber = (value: number | undefined | null) => {
    if (value == null) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "green",
      usage: "red",
      admin_credit: "blue",
      admin_debit: "orange",
      refund: "purple",
      bonus: "cyan",
    };
    return colors[type] || "default";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: "Nạp",
      usage: "Dùng",
      admin_credit: "+Admin",
      admin_debit: "-Admin",
      refund: "Hoàn",
      bonus: "Thưởng",
    };
    return labels[type] || type;
  };

  return (
    <Card
      title={
        <span>
          <WalletOutlined style={{ marginRight: 8 }} />
          Giao dịch Token gần đây
        </span>
      }
      size="small"
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Spin />
        </div>
      ) : transactions.length === 0 ? (
        <Empty description="Chưa có giao dịch" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div>
          {transactions.map((item) => (
            <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text ellipsis style={{ maxWidth: 150 }}>
                  {item.userEmail || item.userId || "System"}
                </Text>
                <Tag color={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: (item.amount ?? 0) >= 0 ? "#52c41a" : "#ff4d4f",
                    fontWeight: 500,
                  }}
                >
                  {(item.amount ?? 0) >= 0 ? "+" : ""}
                  {formatNumber(item.amount)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
