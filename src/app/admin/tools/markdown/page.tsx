"use client";

import { useState, useCallback } from "react";
import { Typography, Input, Card, Row, Col, Button, Space, Divider, message } from "antd";
import { CopyOutlined, ClearOutlined, SwapOutlined } from "@ant-design/icons";
import { parseMarkdown, blocksToHtml, type ContentBlock } from "@/components/posts/block-editor";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MarkdownConverterPage() {
  const [markdown, setMarkdown] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [html, setHtml] = useState("");

  const handleConvert = useCallback(() => {
    if (!markdown.trim()) {
      setBlocks([]);
      setHtml("");
      return;
    }
    const parsed = parseMarkdown(markdown);
    const generated = blocksToHtml(parsed);
    setBlocks(parsed);
    setHtml(generated);
  }, [markdown]);

  const handleCopyHtml = useCallback(() => {
    navigator.clipboard.writeText(html);
    message.success("Đã copy HTML");
  }, [html]);

  const handleCopyText = useCallback(() => {
    const el = document.createElement("div");
    el.innerHTML = html;
    navigator.clipboard.writeText(el.textContent || "");
    message.success("Đã copy văn bản");
  }, [html]);

  const handleClear = useCallback(() => {
    setMarkdown("");
    setBlocks([]);
    setHtml("");
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Markdown → Văn bản</Title>
        <Text type="secondary">Paste markdown vào bên trái, nhấn chuyển đổi để xem kết quả</Text>
      </div>

      <Row gutter={16}>
        {/* Input */}
        <Col xs={24} lg={12}>
          <Card
            title="Markdown"
            size="small"
            extra={
              <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>
                Xoá
              </Button>
            }
          >
            <TextArea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Paste markdown vào đây..."
              autoSize={{ minRows: 20, maxRows: 40 }}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
          </Card>
        </Col>

        {/* Output */}
        <Col xs={24} lg={12}>
          <Card
            title="Kết quả"
            size="small"
            extra={
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyText}>
                  Copy Text
                </Button>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyHtml}>
                  Copy HTML
                </Button>
              </Space>
            }
          >
            {html ? (
              <div
                className="post-preview-content"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ fontSize: 15, lineHeight: 1.8, color: "#333", minHeight: 300 }}
              />
            ) : (
              <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb" }}>
                Nhấn &quot;Chuyển đổi&quot; để xem kết quả
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Convert button */}
      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <Button type="primary" size="large" icon={<SwapOutlined />} onClick={handleConvert}>
          Chuyển đổi
        </Button>
      </div>

      {/* Blocks debug */}
      {blocks.length > 0 && (
        <>
          <Divider />
          <Card title={`Blocks (${blocks.length})`} size="small">
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {blocks.map((b, i) => (
                <div key={b.id} style={{ padding: "4px 8px", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                  <Text code style={{ marginRight: 8 }}>{b.type.toUpperCase()}</Text>
                  <Text type="secondary">{b.content.substring(0, 120)}{b.content.length > 120 ? "..." : ""}</Text>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* HTML source */}
      {html && (
        <Card title="HTML Source" size="small" style={{ marginTop: 16 }}>
          <TextArea
            value={html}
            readOnly
            autoSize={{ minRows: 5, maxRows: 15 }}
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Card>
      )}

      {/* Styles for preview content */}
      <style jsx global>{`
        .post-preview-content h1 { font-size: 28px; font-weight: 700; margin: 32px 0 16px; color: #1a1a1a; }
        .post-preview-content h2 { font-size: 24px; font-weight: 600; margin: 28px 0 14px; color: #1a1a1a; }
        .post-preview-content h3 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #1a1a1a; }
        .post-preview-content h4 { font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #1a1a1a; }
        .post-preview-content p { margin: 0 0 16px; }
        .post-preview-content ul, .post-preview-content ol { padding-left: 24px; margin: 0 0 16px; }
        .post-preview-content li { margin-bottom: 6px; }
        .post-preview-content blockquote {
          border-left: 4px solid #d9d9d9;
          padding: 12px 20px;
          margin: 16px 0;
          background: #fafafa;
          color: #666;
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }
        .post-preview-content pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 16px 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          font-size: 14px;
          line-height: 1.6;
        }
        .post-preview-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .post-preview-content hr {
          border: none;
          border-top: 1px solid #e8e8e8;
          margin: 24px 0;
        }
        .post-preview-content a { color: #1890ff; text-decoration: underline; }
        .post-preview-content strong { font-weight: 600; }
        .post-preview-content em { font-style: italic; }
      `}</style>
    </div>
  );
}
