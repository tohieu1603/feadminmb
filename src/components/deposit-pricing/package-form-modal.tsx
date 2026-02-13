"use client";

import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Switch, Button } from "antd";
import type { DepositPackage } from "@/types";

interface PackageFormModalProps {
  open: boolean;
  pkg: DepositPackage | null; // null = create mode
  onSave: (values: DepositPackage) => void;
  onClose: () => void;
}

export function PackageFormModal({ open, pkg, onSave, onClose }: PackageFormModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!pkg;

  useEffect(() => {
    if (open && pkg) {
      form.setFieldsValue(pkg);
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ bonus: 0, popular: false });
    }
  }, [open, pkg, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSave(values);
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa gói" : "Thêm gói mới"}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Huỷ</Button>,
        <Button key="save" type="primary" onClick={handleSubmit}>
          {isEdit ? "Cập nhật" : "Thêm"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="id"
          label="ID (slug)"
          rules={[{ required: true, message: "Nhập ID" }]}
          tooltip="VD: starter, basic, pro..."
        >
          <Input placeholder="starter" disabled={isEdit} />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên gói"
          rules={[{ required: true, message: "Nhập tên" }]}
        >
          <Input placeholder="Starter" />
        </Form.Item>
        <Form.Item
          name="tokens"
          label="Tokens"
          rules={[{ required: true, message: "Nhập số tokens" }]}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
        <Form.Item
          name="priceVnd"
          label="Giá (VND)"
          rules={[{ required: true, message: "Nhập giá" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
        <Form.Item name="bonus" label="Bonus Tokens">
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>
        <Form.Item name="popular" label="Popular" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
