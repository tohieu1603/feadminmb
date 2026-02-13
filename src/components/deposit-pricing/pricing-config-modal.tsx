"use client";

import { useEffect } from "react";
import { Modal, Form, InputNumber, Button } from "antd";

interface PricingConfigModalProps {
  open: boolean;
  initialValues: {
    pricePerMillion: number;
    minimumTokens: number;
    minimumVnd: number;
  } | null;
  onSave: (values: { pricePerMillion: number; minimumTokens: number; minimumVnd: number }) => void;
  onClose: () => void;
  loading?: boolean;
}

export function PricingConfigModal({ open, initialValues, onSave, onClose, loading }: PricingConfigModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [open, initialValues, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSave(values);
  };

  return (
    <Modal
      title="Cấu hình bảng giá"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Huỷ</Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSubmit}>Lưu</Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="pricePerMillion"
          label="Giá / 1 triệu Tokens (VND)"
          rules={[{ required: true, message: "Nhập giá" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
        <Form.Item
          name="minimumTokens"
          label="Token tối thiểu"
          rules={[{ required: true, message: "Nhập số token tối thiểu" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
        <Form.Item
          name="minimumVnd"
          label="Nạp tối thiểu (VND)"
          rules={[{ required: true, message: "Nhập số tiền tối thiểu" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
