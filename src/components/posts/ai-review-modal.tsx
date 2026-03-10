"use client";

import { useState } from "react";
import { Modal, Button, Typography, Spin, Space, Tag, Divider, Collapse, App } from "antd";
import { RobotOutlined, CheckCircleOutlined, WarningOutlined, BulbOutlined, FormatPainterOutlined } from "@ant-design/icons";
import api from "@/lib/api";
import type { ContentBlock } from "./block-editor";
import { blocksToHtml } from "./block-editor";

const { Text, Paragraph } = Typography;

interface AiReviewModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    title?: string;
    subtitle?: string;
    excerpt?: string;
    contentBlocks: ContentBlock[];
    categoryName?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  onApplySuggestion?: (type: string, value: string) => void;
}

interface ReviewResult {
  summary: string;
  score: number;
  issues: { type: "error" | "warning" | "info"; message: string }[];
  suggestions: { field: string; label: string; current: string; suggested: string }[];
  seoTips: string[];
  formattedTitle?: string;
  formattedExcerpt?: string;
  formattedMetaTitle?: string;
  formattedMetaDescription?: string;
}

export default function AiReviewModal({ open, onClose, data, onApplySuggestion }: AiReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  const { message } = App.useApp();

  const runReview = async () => {
    setLoading(true);
    setResult(null);
    setRawResponse("");

    const contentText = data.contentBlocks.map((b) => {
      if (b.type === "hr") return "---";
      const prefix = b.type.startsWith("h") ? "#".repeat(parseInt(b.type[1])) + " " : "";
      return prefix + b.content;
    }).join("\n\n");

    const prompt = `Bạn là chuyên gia SEO và biên tập nội dung. Hãy review bài viết sau và trả về JSON (không markdown, chỉ JSON thuần):

Tiêu đề: ${data.title || "(trống)"}
Tiêu đề phụ: ${data.subtitle || "(trống)"}
Trích dẫn: ${data.excerpt || "(trống)"}
Danh mục: ${data.categoryName || "(trống)"}
Tags: ${data.tags?.join(", ") || "(trống)"}
Meta Title: ${data.metaTitle || "(trống)"}
Meta Description: ${data.metaDescription || "(trống)"}

--- NỘI DUNG ---
${contentText.substring(0, 4000)}
--- HẾT NỘI DUNG ---

Trả về JSON có cấu trúc:
{
  "summary": "Tóm tắt đánh giá ngắn 1-2 câu",
  "score": 0-100,
  "issues": [{"type": "error|warning|info", "message": "..."}],
  "suggestions": [{"field": "title|excerpt|meta_title|meta_description", "label": "Tên trường", "current": "giá trị hiện tại", "suggested": "gợi ý cải thiện"}],
  "seoTips": ["tip 1", "tip 2"],
  "formattedTitle": "Tiêu đề đã tối ưu (nếu cần sửa)",
  "formattedExcerpt": "Trích dẫn đã tối ưu (nếu cần sửa, tối đa 160 ký tự)",
  "formattedMetaTitle": "Meta title tối ưu (tối đa 70 ký tự)",
  "formattedMetaDescription": "Meta description tối ưu (tối đa 160 ký tự)"
}

Lưu ý:
- Kiểm tra chính tả, ngữ pháp tiếng Việt
- Đánh giá cấu trúc heading (H1, H2, H3)
- Kiểm tra SEO: title length, meta description, keyword density
- Gợi ý cải thiện cụ thể cho từng trường
- Nếu trường nào OK thì không cần suggestion
- Score: 90+ = tốt, 70-89 = khá, 50-69 = cần cải thiện, <50 = kém
- CHỈ trả về JSON, không markdown, không giải thích thêm`;

    try {
      // Gọi BytePlus proxy (kimi-k2.5) — OpenAI-compatible format
      const res = await api.post("/v1/byteplus/chat/completions", {
        model: "kimi-k2.5",
        messages: [
          { role: "system", content: "Bạn là AI assistant chuyên review nội dung blog. Luôn trả về JSON hợp lệ, không bao giờ dùng markdown code block. Trả về trực tiếp JSON object." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }, { timeout: 120000 });

      const responseText = res.data.choices?.[0]?.message?.content || "";
      setRawResponse(responseText);

      // Parse JSON from response - try to extract JSON from response
      let parsed: ReviewResult;
      try {
        // Try direct parse first
        parsed = JSON.parse(responseText);
      } catch {
        // Try to extract JSON from text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Không thể parse JSON từ AI response");
        }
      }

      setResult(parsed);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errMsg = error.response?.data?.error || error.message || "Lỗi không xác định";
      message.error(`AI Review thất bại: ${errMsg}`);
      if (rawResponse) {
        // Show raw response if parsing failed
        setResult({
          summary: "Không thể parse kết quả AI. Xem raw response bên dưới.",
          score: 0,
          issues: [{ type: "error", message: rawResponse.substring(0, 500) }],
          suggestions: [],
          seoTips: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#52c41a";
    if (score >= 70) return "#faad14";
    if (score >= 50) return "#fa8c16";
    return "#f5222d";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Tốt";
    if (score >= 70) return "Khá";
    if (score >= 50) return "Cần cải thiện";
    return "Kém";
  };

  const issueIcon = (type: string) => {
    if (type === "error") return <WarningOutlined style={{ color: "#f5222d" }} />;
    if (type === "warning") return <WarningOutlined style={{ color: "#faad14" }} />;
    return <BulbOutlined style={{ color: "#1890ff" }} />;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      styles={{ body: { maxHeight: "80vh", overflowY: "auto" } }}
      title={
        <Space>
          <RobotOutlined style={{ color: "#722ed1" }} />
          <span>AI Review bài viết</span>
        </Space>
      }
    >
      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <RobotOutlined style={{ fontSize: 48, color: "#722ed1", marginBottom: 16 }} />
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            AI sẽ kiểm tra nội dung bài viết: chính tả, ngữ pháp, cấu trúc heading, SEO,
            và đưa ra gợi ý cải thiện cụ thể.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            onClick={runReview}
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
          >
            Bắt đầu AI Review
          </Button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Spin size="large" />
          <Paragraph type="secondary" style={{ marginTop: 16 }}>
            AI đang phân tích bài viết...
          </Paragraph>
        </div>
      )}

      {result && (
        <div>
          {/* Score */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, padding: 20,
            background: "#fafafa", borderRadius: 12, marginBottom: 20,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: getScoreColor(result.score), color: "#fff",
              fontSize: 24, fontWeight: 700,
            }}>
              {result.score}
            </div>
            <div>
              <Tag color={getScoreColor(result.score)} style={{ marginBottom: 4 }}>
                {getScoreLabel(result.score)}
              </Tag>
              <Paragraph style={{ margin: 0 }}>{result.summary}</Paragraph>
            </div>
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <>
              <Text strong style={{ fontSize: 15 }}>Vấn đề phát hiện ({result.issues.length})</Text>
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, padding: "8px 12px",
                    background: issue.type === "error" ? "#fff2f0" : issue.type === "warning" ? "#fffbe6" : "#f0f5ff",
                    borderRadius: 8, marginBottom: 6,
                  }}>
                    {issueIcon(issue.type)}
                    <Text style={{ flex: 1 }}>{issue.message}</Text>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <>
              <Text strong style={{ fontSize: 15 }}>Gợi ý cải thiện</Text>
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{
                    padding: 12, background: "#f9f0ff", borderRadius: 8,
                    marginBottom: 8, border: "1px solid #d3adf7",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Tag color="purple">{s.label}</Tag>
                      {onApplySuggestion && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<FormatPainterOutlined />}
                          onClick={() => onApplySuggestion(s.field, s.suggested)}
                          style={{ background: "#722ed1", borderColor: "#722ed1" }}
                        >
                          Áp dụng
                        </Button>
                      )}
                    </div>
                    {s.current && (
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Hiện tại: </Text>
                        <Text delete style={{ fontSize: 13 }}>{s.current}</Text>
                      </div>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Gợi ý: </Text>
                      <Text strong style={{ fontSize: 13, color: "#722ed1" }}>{s.suggested}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SEO Tips */}
          {result.seoTips && result.seoTips.length > 0 && (
            <>
              <Text strong style={{ fontSize: 15 }}>SEO Tips</Text>
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                {result.seoTips.map((tip, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, padding: "6px 12px",
                    background: "#f6ffed", borderRadius: 6, marginBottom: 4,
                  }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", marginTop: 3 }} />
                    <Text>{tip}</Text>
                  </div>
                ))}
              </div>
            </>
          )}

          <Divider />

          {/* Re-run */}
          <div style={{ textAlign: "center" }}>
            <Button icon={<RobotOutlined />} onClick={runReview}>
              Chạy lại AI Review
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
