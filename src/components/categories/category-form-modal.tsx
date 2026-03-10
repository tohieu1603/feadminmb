"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Collapse,
  Space,
} from "antd";
import { App } from "antd";
import api from "@/lib/api";
import type { Category } from "@/types";
import { useCreateCategory, useUpdateCategory, useCategoryTree } from "@/hooks/use-categories";

interface CategoryFormModalProps {
  open: boolean;
  category?: Category | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
}

// Flatten tree into list for parent selector, excluding current category subtree
function flattenTree(nodes: Category[], excludeId?: string, depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({ id: node.id, name: node.name, depth });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, excludeId, depth + 1));
    }
  }
  return result;
}

export function CategoryFormModal({ open, category, onClose }: CategoryFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { message } = App.useApp();

  const { data: treeData = [] } = useCategoryTree();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEdit = !!category;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Flatten tree excluding current category (can't be its own parent)
  const parentOptions = flattenTree(treeData, category?.id ?? undefined);

  useEffect(() => {
    if (open) {
      setSlugManuallyEdited(false);
      if (category) {
        form.setFieldsValue({
          name: category.name,
          slug: category.slug,
          description: category.description ?? undefined,
          parent_id: category.parentId ?? undefined,
          sort_order: category.sortOrder,
          is_active: category.isActive,
          seo_title: category.seoTitle ?? undefined,
          seo_description: category.seoDescription ?? undefined,
          og_image: category.ogImage ?? undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, sort_order: 0 });
      }
    }
  }, [open, category, form]);

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit && !slugManuallyEdited) {
      const name = e.target.value;
      if (name) {
        try {
          const res = await api.post<{ slug: string }>("/post-categories/generate-slug", { name });
          form.setFieldValue("slug", res.data.slug);
        } catch {
          // ignore, user can type slug manually
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
      const payload: Record<string, unknown> = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        parent_id: values.parent_id || null,
        sort_order: values.sort_order ?? 0,
        is_active: values.is_active,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        og_image: values.og_image || null,
      };

      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      // Validation errors handled by Form; API errors handled in hook
      const error = err as { response?: { data?: { error?: string } } };
      if (error?.response?.data?.error) {
        message.error(error.response.data.error);
      }
    }
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
      open={open}
      onCancel={onClose}
      width={640}
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
          label="Tên danh mục"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
        >
          <Input placeholder="Nhập tên danh mục" onChange={handleNameChange} />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true, message: "Vui lòng nhập slug" }]}
        >
          <Input placeholder="vi-du-slug" onChange={handleSlugChange} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn về danh mục" />
        </Form.Item>

        <Form.Item name="parent_id" label="Danh mục cha">
          <Select
            allowClear
            placeholder="Chọn danh mục cha (để trống nếu là gốc)"
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={parentOptions.map((opt) => ({
              value: opt.id,
              label: `${"—".repeat(opt.depth)} ${opt.name}`.trim(),
            }))}
          />
        </Form.Item>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item name="sort_order" label="Thứ tự sắp xếp" style={{ marginBottom: 0 }}>
            <InputNumber min={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Space>

        <Collapse
          ghost
          style={{ marginTop: 16 }}
          items={[
            {
              key: "seo",
              label: "SEO (nâng cao)",
              children: (
                <>
                  <Form.Item name="seo_title" label="SEO Title">
                    <Input placeholder="Tiêu đề SEO" />
                  </Form.Item>
                  <Form.Item name="seo_description" label="SEO Description">
                    <Input.TextArea rows={2} placeholder="Mô tả SEO" />
                  </Form.Item>
                  <Form.Item name="og_image" label="OG Image URL">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}
