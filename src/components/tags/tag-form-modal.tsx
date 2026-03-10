"use client";

import { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Button, Space, ColorPicker } from "antd";
import { App } from "antd";
import api from "@/lib/api";
import type { Tag } from "@/types";
import { useCreateTag, useUpdateTag } from "@/hooks/use-tags";
import type { Color } from "antd/es/color-picker";

interface TagFormModalProps {
  open: boolean;
  tag?: Tag | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  slug: string;
  description?: string;
  color?: Color | string;
  is_active: boolean;
}

export function TagFormModal({ open, tag, onClose }: TagFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { message } = App.useApp();

  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();

  const isEdit = !!tag;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setSlugManuallyEdited(false);
      if (tag) {
        form.setFieldsValue({
          name: tag.name,
          slug: tag.slug,
          description: tag.description ?? undefined,
          color: tag.color ?? undefined,
          is_active: tag.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [open, tag, form]);

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit && !slugManuallyEdited) {
      const name = e.target.value;
      if (name) {
        try {
          const res = await api.post<{ slug: string }>("/post-tags/generate-slug", { name });
          form.setFieldValue("slug", res.data.slug);
        } catch {
          // ignore
        }
      } else {
        form.setFieldValue("slug", "");
      }
    }
  };

  const handleSlugChange = () => {
    if (!isEdit) setSlugManuallyEdited(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Color can be antd Color object or plain string
      let colorStr: string | null = null;
      if (values.color) {
        if (typeof values.color === "string") {
          colorStr = values.color;
        } else {
          colorStr = (values.color as Color).toHexString();
        }
      }

      const payload: Record<string, unknown> = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        color: colorStr,
        is_active: values.is_active,
      };

      if (isEdit && tag) {
        await updateMutation.mutateAsync({ id: tag.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      if (error?.response?.data?.error) {
        message.error(error.response.data.error);
      }
    }
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa tag" : "Thêm tag"}
      open={open}
      onCancel={onClose}
      width={520}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Tên tag"
          rules={[{ required: true, message: "Vui lòng nhập tên tag" }]}
        >
          <Input placeholder="Nhập tên tag" onChange={handleNameChange} />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true, message: "Vui lòng nhập slug" }]}
        >
          <Input placeholder="vi-du-slug" onChange={handleSlugChange} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} placeholder="Mô tả ngắn về tag" />
        </Form.Item>

        <Form.Item name="color" label="Màu sắc">
          <ColorPicker
            format="hex"
            showText
            presets={[
              {
                label: "Màu thông dụng",
                colors: [
                  "#F5222D",
                  "#FA8C16",
                  "#FADB14",
                  "#52C41A",
                  "#13C2C2",
                  "#1677FF",
                  "#722ED1",
                  "#EB2F96",
                  "#8C8C8C",
                  "#000000",
                ],
              },
            ]}
          />
        </Form.Item>

        <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
