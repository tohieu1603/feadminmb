"use client";

import { Modal, Form, InputNumber, Input, Typography } from "antd";
import type { User } from "@/types";
import { useTopupUser } from "@/hooks/use-users";

const { Text } = Typography;

interface TopupModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

interface TopupFormValues {
  amount: number;
  note?: string;
}

export function TopupModal({ open, user, onClose }: TopupModalProps) {
  const [form] = Form.useForm<TopupFormValues>();
  const topupMutation = useTopupUser();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!user) return;

      await topupMutation.mutateAsync({
        userId: user.id,
        amount: values.amount,
        note: values.note,
      });

      form.resetFields();
      onClose();
    } catch {
      // Form validation error
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // Format number with commas
  const formatNumber = (value: number | undefined) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Modal
      title="Nạp Token"
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="Nạp Token"
      cancelText="Hủy"
      confirmLoading={topupMutation.isPending}
      destroyOnClose
    >
      {user && (
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">User: </Text>
          <Text strong>{user.email}</Text>
          <br />
          <Text type="secondary">Số dư hiện tại: </Text>
          <Text strong style={{ color: "#1890ff" }}>
            {formatNumber(user.tokenBalance)} tokens
          </Text>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="amount"
          label="Số token"
          rules={[
            { required: true, message: "Vui lòng nhập số token" },
            { type: "number", min: 1, message: "Số token phải lớn hơn 0" },
          ]}
        >
          <InputNumber<number>
            style={{ width: "100%" }}
            placeholder="Nhập số token"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => Number(value?.replace(/,/g, "") || 0)}
            min={1}
          />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea
            placeholder="Lý do nạp token (tùy chọn)"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
