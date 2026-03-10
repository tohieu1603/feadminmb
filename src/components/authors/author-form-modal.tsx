"use client";

import { useEffect, useState } from "react";
import {
  Modal, Form, Input, Switch, Button, Space, Tabs, Upload, Spin,
  Image as AntImage,
} from "antd";
import { App } from "antd";
import { UploadOutlined, CloseCircleOutlined } from "@ant-design/icons";
import api from "@/lib/api";
import type { Author } from "@/types";
import { useCreateAuthor, useUpdateAuthor } from "@/hooks/use-authors";

interface AuthorFormModalProps {
  open: boolean;
  author?: Author | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  slug: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  short_bio?: string;
  job_title?: string;
  company?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  github?: string;
  youtube?: string;
  is_active: boolean;
  is_featured: boolean;
}

export function AuthorFormModal({ open, author, onClose }: AuthorFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { message } = App.useApp();

  const createMutation = useCreateAuthor();
  const updateMutation = useUpdateAuthor();

  const isEdit = !!author;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setSlugManuallyEdited(false);
      if (author) {
        form.setFieldsValue({
          name: author.name,
          slug: author.slug,
          email: author.email ?? undefined,
          avatar_url: author.avatarUrl ?? undefined,
          bio: author.bio ?? undefined,
          short_bio: author.shortBio ?? undefined,
          job_title: author.jobTitle ?? undefined,
          company: author.company ?? undefined,
          location: author.location ?? undefined,
          website: author.website ?? undefined,
          twitter: author.twitter ?? undefined,
          linkedin: author.linkedin ?? undefined,
          facebook: author.facebook ?? undefined,
          github: author.github ?? undefined,
          youtube: author.youtube ?? undefined,
          is_active: author.isActive,
          is_featured: author.isFeatured,
        });
        setAvatarPreview(author.avatarUrl || "");
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, is_featured: false });
        setAvatarPreview("");
      }
    }
  }, [open, author, form]);

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit && !slugManuallyEdited) {
      const name = e.target.value;
      if (name) {
        try {
          const res = await api.post<{ slug: string }>("/post-authors/generate-slug", { name });
          form.setFieldValue("slug", res.data.slug);
        } catch {
          // ignore
        }
      } else {
        form.setFieldValue("slug", "");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: Record<string, unknown> = {
        name: values.name,
        slug: values.slug,
        email: values.email || null,
        avatar_url: values.avatar_url || null,
        bio: values.bio || null,
        short_bio: values.short_bio || null,
        job_title: values.job_title || null,
        company: values.company || null,
        location: values.location || null,
        website: values.website || null,
        twitter: values.twitter || null,
        linkedin: values.linkedin || null,
        facebook: values.facebook || null,
        github: values.github || null,
        youtube: values.youtube || null,
        is_active: values.is_active,
        is_featured: values.is_featured,
      };

      if (isEdit && author) {
        await updateMutation.mutateAsync({ id: author.id, data: payload });
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

  const tabItems = [
    {
      key: "basic",
      label: "Thông tin cơ bản",
      children: (
        <>
          <Form.Item
            name="name"
            label="Tên tác giả"
            rules={[{ required: true, message: "Vui lòng nhập tên tác giả" }]}
          >
            <Input placeholder="Nhập tên tác giả" onChange={handleNameChange} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Vui lòng nhập slug" }]}
          >
            <Input
              placeholder="vi-du-slug"
              onChange={() => { if (!isEdit) setSlugManuallyEdited(true); }}
            />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="email@example.com" type="email" />
          </Form.Item>

          {/* Avatar upload - same pattern as post cover image */}
          <Form.Item label="Avatar">
            <Upload.Dragger
              name="file"
              accept="image/*"
              showUploadList={false}
              disabled={avatarUploading}
              customRequest={async ({ file, onSuccess, onError }) => {
                setAvatarUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file as Blob);
                  formData.append("folder", "avatars");
                  const res = await api.post("/media/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  const url = res.data.url;
                  form.setFieldValue("avatar_url", url);
                  setAvatarPreview(url);
                  message.success("Upload thành công");
                  onSuccess?.(res.data);
                } catch (err: unknown) {
                  const error = err as { response?: { data?: { error?: string } } };
                  message.error(error.response?.data?.error || "Upload thất bại");
                  onError?.(err as Error);
                } finally {
                  setAvatarUploading(false);
                }
              }}
              style={{ padding: "4px 0", marginBottom: 8 }}
            >
              {avatarUploading ? <Spin /> : (
                <>
                  <p style={{ marginBottom: 4 }}><UploadOutlined style={{ fontSize: 20, color: "#999" }} /></p>
                  <p style={{ color: "#666", fontSize: 12, margin: 0 }}>Click hoặc kéo ảnh vào đây</p>
                </>
              )}
            </Upload.Dragger>

            <Form.Item name="avatar_url" label="Link ảnh" style={{ marginBottom: 8 }}>
              <Input
                placeholder="https://... hoặc upload ở trên"
                allowClear
                onChange={(e) => setAvatarPreview(e.target.value)}
              />
            </Form.Item>

            {avatarPreview && (
              <div style={{ position: "relative", marginBottom: 8, maxWidth: 120 }}>
                <AntImage
                  src={avatarPreview}
                  alt="Avatar preview"
                  style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                />
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<CloseCircleOutlined />}
                  style={{ position: "absolute", top: 0, right: -8, background: "rgba(255,255,255,0.8)" }}
                  onClick={() => { form.setFieldValue("avatar_url", ""); setAvatarPreview(""); }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item name="job_title" label="Chức danh">
            <Input placeholder="VD: Senior Developer" />
          </Form.Item>

          <Form.Item name="company" label="Công ty">
            <Input placeholder="VD: Google" />
          </Form.Item>

          <Form.Item name="location" label="Địa điểm">
            <Input placeholder="VD: TP. Hồ Chí Minh" />
          </Form.Item>

          <Form.Item name="short_bio" label="Giới thiệu ngắn">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về tác giả" />
          </Form.Item>

          <Form.Item name="bio" label="Tiểu sử">
            <Input.TextArea rows={4} placeholder="Tiểu sử đầy đủ" />
          </Form.Item>

          <Space size={24}>
            <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
            </Form.Item>

            <Form.Item name="is_featured" label="Nổi bật" valuePropName="checked">
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Space>
        </>
      ),
    },
    {
      key: "social",
      label: "Mạng xã hội",
      children: (
        <>
          <Form.Item name="website" label="Website">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="twitter" label="Twitter / X">
            <Input placeholder="@username" />
          </Form.Item>
          <Form.Item name="linkedin" label="LinkedIn">
            <Input placeholder="https://linkedin.com/in/..." />
          </Form.Item>
          <Form.Item name="facebook" label="Facebook">
            <Input placeholder="https://facebook.com/..." />
          </Form.Item>
          <Form.Item name="github" label="GitHub">
            <Input placeholder="@username" />
          </Form.Item>
          <Form.Item name="youtube" label="YouTube">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa tác giả" : "Thêm tác giả"}
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
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Tabs items={tabItems} />
      </Form>
    </Modal>
  );
}
