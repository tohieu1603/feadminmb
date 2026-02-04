"use client";

import { Modal, Form, InputNumber, Input, Typography, Alert } from "antd";
import type { Deposit } from "@/types";
import { useUpdateDeposit } from "@/hooks/use-deposits";

const { Text } = Typography;

interface DepositActionModalProps {
  open: boolean;
  deposit: Deposit | null;
  action: "complete" | "cancel";
  onClose: () => void;
}

interface ActionFormValues {
  tokens?: number;
  note?: string;
}

export function DepositActionModal({
  open,
  deposit,
  action,
  onClose,
}: DepositActionModalProps) {
  const [form] = Form.useForm<ActionFormValues>();
  const updateMutation = useUpdateDeposit();

  const isComplete = action === "complete";

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!deposit) return;

      await updateMutation.mutateAsync({
        depositId: deposit.id,
        action,
        tokens: isComplete ? values.tokens : undefined,
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

  // Format number
  const formatNumber = (value: number | undefined) => {
    if (!value) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Modal
      title={isComplete ? "Hoàn thành đơn nạp" : "Hủy đơn nạp"}
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText={isComplete ? "Hoàn thành" : "Hủy đơn"}
      okButtonProps={{ danger: !isComplete }}
      cancelText="Đóng"
      confirmLoading={updateMutation.isPending}
      destroyOnClose
    >
      {deposit && (
        <>
          {!isComplete && (
            <Alert
              type="warning"
              message="Bạn có chắc chắn muốn hủy đơn nạp này?"
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">ID đơn: </Text>
            <Text strong>{deposit.id}</Text>
            <br />
            <Text type="secondary">User: </Text>
            <Text strong>{deposit.userEmail || deposit.userId}</Text>
            <br />
            <Text type="secondary">Số tiền: </Text>
            <Text strong>{formatNumber(deposit.amount)} VND</Text>
            <br />
            <Text type="secondary">Tokens dự kiến: </Text>
            <Text strong style={{ color: "#52c41a" }}>
              {formatNumber(deposit.tokens)}
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              tokens: deposit.tokens,
            }}
          >
            {isComplete && (
              <Form.Item
                name="tokens"
                label="Số token thực nhận"
                rules={[
                  { required: true, message: "Vui lòng nhập số token" },
                  { type: "number", min: 1, message: "Số token phải lớn hơn 0" },
                ]}
              >
                <InputNumber<number>
                  style={{ width: "100%" }}
                  placeholder="Nhập số token"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value?.replace(/,/g, "") || 0)}
                  min={1}
                />
              </Form.Item>
            )}

            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea
                placeholder={
                  isComplete
                    ? "Ghi chú xác nhận (tùy chọn)"
                    : "Lý do hủy đơn (tùy chọn)"
                }
                rows={3}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
