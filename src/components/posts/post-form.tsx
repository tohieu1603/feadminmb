"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form, Input, Select, Button, Card, Row, Col, Switch, Typography,
  Collapse, Space, Divider, InputNumber, Image as AntImage, Spin, Upload,
  App,
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined, EyeOutlined, PlusOutlined, DeleteOutlined,
  UploadOutlined, CloseCircleOutlined, RobotOutlined,
} from "@ant-design/icons";
import api from "@/lib/api";
import { usePost, useCreatePost, useUpdatePost, useCategories, useAuthors, useTags } from "@/hooks/use-posts";
import { type ContentBlock, blocksToHtml, parseToBlocks } from "@/components/posts/block-editor";
import dynamic from "next/dynamic";

const PostPreviewModal = dynamic(() => import("@/components/posts/post-preview-modal"), { ssr: false });
const AiReviewModal = dynamic(() => import("@/components/posts/ai-review-modal"), { ssr: false });
const BlockEditor = dynamic(() => import("@/components/posts/block-editor"), {
  ssr: false,
  loading: () => <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d9d9d9", borderRadius: 8 }}><Spin /></div>,
});

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PostFormProps {
  postId?: string;
}

export default function PostForm({ postId }: PostFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);

  // React Query hooks
  const { data: post, isLoading: loadingPost } = usePost(postId || "");
  const { data: categories = [] } = useCategories();
  const { data: authors = [] } = useAuthors();
  const { data: tags = [] } = useTags();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  // Populate form when post data loads
  useEffect(() => {
    if (!post) return;
    form.setFieldsValue({
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      category_id: post.categoryId,
      author_id: post.authorId,
      author: post.author,
      tags_relation: post.tagsRelation || [],
      cover_image: post.coverImage,
      is_featured: post.isFeatured,
      is_trending: post.isTrending,
      allow_comments: post.allowComments,
      is_evergreen: post.isEvergreen ?? false,
      reading_time: post.readingTime,
      meta_title: post.metaTitle,
      meta_description: post.metaDescription,
      meta_keywords: post.metaKeywords,
      canonical_url: post.canonicalUrl,
      og_title: post.ogTitle,
      og_description: post.ogDescription,
      og_image: post.ogImage,
      robots: post.robots,
      news_keywords: post.newsKeywords,
    });
    if (post.content_blocks?.length) {
      setContentBlocks(post.content_blocks);
    } else if (post.content) {
      setContentBlocks(parseToBlocks(post.content));
    }
    setCoverPreview(post.coverImage || "");
    setFaqItems(post.faq || []);
    if (searchParams.get("preview") === "1") setPreviewOpen(true);
  }, [post, form, searchParams]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!postId && !form.getFieldValue("slug")) {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      form.setFieldValue("slug", slug);
    }
  }, [postId, form]);

  const handleSave = async (values: Record<string, unknown>) => {
    if (contentBlocks.length === 0) {
      message.warning("Nội dung bài viết không được để trống");
      return;
    }

    setSaving(true);
    try {
      const html = blocksToHtml(contentBlocks);
      const payload = {
        ...values,
        content: html,
        content_blocks: contentBlocks,
        faq: faqItems.length > 0 ? faqItems : null,
      };

      if (postId) {
        await updatePost.mutateAsync({ id: postId, data: payload });
      } else {
        await createPost.mutateAsync(payload);
      }
      router.push("/admin/posts");
    } catch {
      // errors handled in hooks
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => setFaqItems([...faqItems, { question: "", answer: "" }]);
  const removeFaq = (idx: number) => setFaqItems(faqItems.filter((_, i) => i !== idx));
  const updateFaq = (idx: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[idx][field] = value;
    setFaqItems(updated);
  };

  if (postId && loadingPost) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/admin/posts")} />
          <Title level={3} style={{ margin: 0 }}>
            {postId ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
          </Title>
        </Space>
        <Space>
          <Button icon={<RobotOutlined />} onClick={() => setAiReviewOpen(true)} style={{ color: "#722ed1", borderColor: "#722ed1" }}>AI Review</Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)} type="default" size="large">Preview</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()} size="large">
            {postId ? "Cập nhật" : "Đăng bài"}
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{
        status: "draft", allow_comments: true, is_featured: false,
        is_trending: false, is_evergreen: false, robots: "index,follow",
      }}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Tiêu đề không được để trống" }]}>
                <Input placeholder="Nhập tiêu đề bài viết..." size="large" style={{ fontSize: 18, fontWeight: 600 }} onChange={handleTitleChange} />
              </Form.Item>
              <Form.Item name="subtitle" label="Tiêu đề phụ">
                <Input placeholder="Tiêu đề phụ (hiển thị dưới tiêu đề chính)" />
              </Form.Item>
              <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true, message: "Slug không được để trống" }]}>
                <Input addonBefore="/" placeholder="tieu-de-bai-viet" />
              </Form.Item>
            </Card>

            <Card title="Nội dung bài viết" style={{ marginBottom: 16 }}>
              <BlockEditor blocks={contentBlocks} onChange={setContentBlocks} />
            </Card>

            <Card title="Trích dẫn / Mô tả ngắn" style={{ marginBottom: 16 }}>
              <Form.Item name="excerpt" style={{ marginBottom: 0 }}>
                <TextArea rows={3} placeholder="Mô tả ngắn hiển thị ở trang danh sách, kết quả tìm kiếm..." maxLength={500} showCount />
              </Form.Item>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <Collapse ghost items={[
                {
                  key: "seo-basic",
                  label: <Text strong>SEO - Meta Tags</Text>,
                  children: (
                    <>
                      <Form.Item name="meta_title" label="Meta Title" extra="Tối đa 70 ký tự.">
                        <Input maxLength={70} showCount placeholder="Tiêu đề hiển thị trên Google" />
                      </Form.Item>
                      <Form.Item name="meta_description" label="Meta Description" extra="Tối đa 160 ký tự.">
                        <TextArea rows={2} maxLength={160} showCount placeholder="Mô tả hiển thị trên Google" />
                      </Form.Item>
                      <Form.Item name="meta_keywords" label="Meta Keywords">
                        <Input placeholder="từ khóa 1, từ khóa 2, ..." />
                      </Form.Item>
                      <Form.Item name="canonical_url" label="Canonical URL">
                        <Input placeholder="https://..." />
                      </Form.Item>
                      <Form.Item name="robots" label="Robots">
                        <Select options={[
                          { value: "index,follow", label: "index, follow" },
                          { value: "noindex,follow", label: "noindex, follow" },
                          { value: "index,nofollow", label: "index, nofollow" },
                          { value: "noindex,nofollow", label: "noindex, nofollow" },
                        ]} />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: "seo-og",
                  label: <Text strong>SEO - Open Graph (Facebook/Zalo)</Text>,
                  children: (
                    <>
                      <Form.Item name="og_title" label="OG Title"><Input placeholder="Tiêu đề khi share" /></Form.Item>
                      <Form.Item name="og_description" label="OG Description"><TextArea rows={2} placeholder="Mô tả khi share" /></Form.Item>
                      <Form.Item name="og_image" label="OG Image URL"><Input placeholder="https://... (1200x630px)" /></Form.Item>
                    </>
                  ),
                },
              ]} />
            </Card>

            <Card title="FAQ (Schema Markup)" style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                FAQ Schema cho Google Rich Results.
              </Text>
              {faqItems.map((faq, idx) => (
                <Card key={idx} size="small" style={{ marginBottom: 8, background: "#fafafa" }}
                  extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeFaq(idx)} />}>
                  <Input placeholder="Câu hỏi" value={faq.question} onChange={(e) => updateFaq(idx, "question", e.target.value)} style={{ marginBottom: 8, fontWeight: 500 }} />
                  <TextArea placeholder="Câu trả lời" value={faq.answer} onChange={(e) => updateFaq(idx, "answer", e.target.value)} rows={2} />
                </Card>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addFaq}>Thêm FAQ</Button>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Xuất bản" style={{ marginBottom: 16 }}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={[
                  { value: "draft", label: "Nháp" },
                  { value: "published", label: "Đã xuất bản" },
                  { value: "archived", label: "Lưu trữ" },
                ]} />
              </Form.Item>
              <Form.Item name="reading_time" label="Thời gian đọc (phút)">
                <InputNumber min={1} max={120} style={{ width: "100%" }} placeholder="Tự động tính nếu trống" />
              </Form.Item>
            </Card>

            <Card title="Phân loại" style={{ marginBottom: 16 }}>
              <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: "Chọn danh mục" }]}>
                <Select placeholder="Chọn danh mục" showSearch optionFilterProp="label" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
              <Form.Item name="author_id" label="Tác giả">
                <Select allowClear placeholder="Chọn tác giả" showSearch optionFilterProp="label" options={authors.map((a) => ({ value: a.id, label: a.name }))} />
              </Form.Item>
              <Form.Item name="tags_relation" label="Tags" extra="Nhập tên tag mới rồi Enter để tạo tự động">
                <Select
                  mode="tags"
                  allowClear
                  placeholder="Chọn hoặc nhập tag mới..."
                  showSearch
                  optionFilterProp="label"
                  tokenSeparators={[","]}
                  options={tags.map((t) => ({ value: t.id, label: t.name }))}
                  onChange={async (values: string[]) => {
                    // Find values that are not existing tag IDs (user typed new tag names)
                    const newTagNames = values.filter((v) => !tags.some((t) => t.id === v));
                    if (newTagNames.length === 0) return;

                    const updatedValues = [...values];
                    for (const name of newTagNames) {
                      try {
                        const slugRes = await api.post("/post-tags/generate-slug", { name });
                        const slug = slugRes.data.slug || name.toLowerCase().replace(/\s+/g, "-");
                        const res = await api.post("/post-tags", { name, slug });
                        const newTag = res.data;
                        // Replace text value with new tag ID
                        const idx = updatedValues.indexOf(name);
                        if (idx !== -1) updatedValues[idx] = newTag.id;
                        message.success(`Đã tạo tag "${name}"`);
                      } catch {
                        message.error(`Tạo tag "${name}" thất bại`);
                        const idx = updatedValues.indexOf(name);
                        if (idx !== -1) updatedValues.splice(idx, 1);
                      }
                    }
                    form.setFieldValue("tags_relation", updatedValues);
                  }}
                />
              </Form.Item>
            </Card>

            <Card title="Ảnh bìa" style={{ marginBottom: 16 }}>
              <Upload.Dragger
                name="file"
                accept="image/*"
                showUploadList={false}
                disabled={coverUploading}
                customRequest={async ({ file, onSuccess, onError }) => {
                  setCoverUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file as Blob);
                    formData.append("folder", "covers");
                    const res = await api.post("/media/upload", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    const url = res.data.url;
                    form.setFieldValue("cover_image", url);
                    setCoverPreview(url);
                    message.success("Upload thành công");
                    onSuccess?.(res.data);
                  } catch (err: unknown) {
                    const error = err as { response?: { data?: { error?: string } } };
                    message.error(error.response?.data?.error || "Upload thất bại");
                    onError?.(err as Error);
                  } finally {
                    setCoverUploading(false);
                  }
                }}
                style={{ padding: "4px 0", marginBottom: 8 }}
              >
                {coverUploading ? <Spin /> : (
                  <>
                    <p style={{ marginBottom: 4 }}><UploadOutlined style={{ fontSize: 20, color: "#999" }} /></p>
                    <p style={{ color: "#666", fontSize: 12, margin: 0 }}>Click hoặc kéo ảnh vào đây</p>
                  </>
                )}
              </Upload.Dragger>

              <Form.Item name="cover_image" label="Link ảnh" style={{ marginBottom: 8 }}>
                <Input placeholder="https://... hoặc upload ở trên" allowClear
                  onChange={(e) => setCoverPreview(e.target.value)} />
              </Form.Item>

              {coverPreview && (
                <>
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    <AntImage src={coverPreview} alt="Cover preview" style={{ width: "100%", borderRadius: 6 }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=" />
                    <Button size="small" danger type="text" icon={<CloseCircleOutlined />}
                      style={{ position: "absolute", top: 4, right: 4, background: "rgba(255,255,255,0.8)" }}
                      onClick={() => { form.setFieldValue("cover_image", ""); setCoverPreview(""); }} />
                  </div>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item name="cover_width" label="Width" style={{ marginBottom: 0 }}>
                        <InputNumber placeholder="px" style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="cover_height" label="Height" style={{ marginBottom: 0 }}>
                        <InputNumber placeholder="px" style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </Card>

            <Card title="Tùy chọn" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {([
                  ["is_featured", "Bài viết nổi bật"],
                  ["is_trending", "Trending"],
                  ["allow_comments", "Cho phép bình luận"],
                  ["is_evergreen", "Evergreen Content"],
                ] as const).map(([name, label], i) => (
                  <div key={name}>
                    {i > 0 && <Divider style={{ margin: "0 0 12px 0" }} />}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text>{label}</Text>
                      <Form.Item name={name} valuePropName="checked" style={{ marginBottom: 0 }}><Switch /></Form.Item>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Từ khóa tin tức" style={{ marginBottom: 16 }}>
              <Form.Item name="news_keywords" style={{ marginBottom: 0 }}>
                <Input placeholder="Google News keywords (phân cách bằng dấu phẩy)" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>

      <PostPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          title: form.getFieldValue("title"),
          subtitle: form.getFieldValue("subtitle"),
          coverImage: coverPreview,
          excerpt: form.getFieldValue("excerpt"),
          contentBlocks,
          categoryName: categories.find((c) => c.id === form.getFieldValue("category_id"))?.name,
          authorName: authors.find((a) => a.id === form.getFieldValue("author_id"))?.name,
          authorAvatar: authors.find((a) => a.id === form.getFieldValue("author_id"))?.avatarUrl,
          authorJobTitle: authors.find((a) => a.id === form.getFieldValue("author_id"))?.jobTitle,
          tags: tags.filter((t) => (form.getFieldValue("tags_relation") || []).includes(t.id)).map((t) => t.name),
          readingTime: form.getFieldValue("reading_time"),
          publishedAt: post?.publishedAt,
          faq: faqItems.filter((f) => f.question && f.answer),
        }}
      />

      <AiReviewModal
        open={aiReviewOpen}
        onClose={() => setAiReviewOpen(false)}
        data={{
          title: form.getFieldValue("title"),
          subtitle: form.getFieldValue("subtitle"),
          excerpt: form.getFieldValue("excerpt"),
          contentBlocks,
          categoryName: categories.find((c) => c.id === form.getFieldValue("category_id"))?.name,
          tags: tags.filter((t) => (form.getFieldValue("tags_relation") || []).includes(t.id)).map((t) => t.name),
          metaTitle: form.getFieldValue("meta_title"),
          metaDescription: form.getFieldValue("meta_description"),
        }}
        onApplySuggestion={(field, value) => {
          form.setFieldValue(field, value);
          message.success(`Đã áp dụng gợi ý cho ${field}`);
        }}
      />
    </div>
  );
}
