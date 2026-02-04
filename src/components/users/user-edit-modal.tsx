"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select, Switch } from "antd";
import type { User } from "@/types";
import { useUpdateUser } from "@/hooks/use-users";

interface UserEditModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

interface UserFormValues {
  name: string;
  role: "user" | "admin";
  isActive: boolean;
}

export function UserEditModal({ open, user, onClose }: UserEditModalProps) {
  const [form] = Form.useForm<UserFormValues>();
  const updateMutation = useUpdateUser();

  // Set form values when user changes
  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        name: user.name,
        role: user.role,
        isActive: user.isActive ?? true,
      });
    }
  }, [user, open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!user) return;

      await updateMutation.mutateAsync({
        id: user.id,
        data: values,
      });

      onClose();
    } catch {
      // Form validation error
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Chỉnh sửa User"
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Email">
          <Input value={user?.email} disabled />
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="Nhập tên" />
        </Form.Item>

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select>
            <Select.Option value="user">User</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
