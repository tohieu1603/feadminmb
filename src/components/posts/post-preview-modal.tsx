"use client";

import { Modal, Avatar } from "antd";
import { UserOutlined, CloseOutlined } from "@ant-design/icons";
import { type ContentBlock, blocksToHtml } from "./block-editor";
import dayjs from "dayjs";

interface PostPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    title?: string;
    subtitle?: string;
    coverImage?: string;
    excerpt?: string;
    contentBlocks: ContentBlock[];
    categoryName?: string;
    authorName?: string;
    authorAvatar?: string;
    authorJobTitle?: string;
    tags?: string[];
    readingTime?: number;
    publishedAt?: string;
    faq?: { question: string; answer: string }[];
    metaTitle?: string;
    metaDescription?: string;
  };
}

export default function PostPreviewModal({ open, onClose, data }: PostPreviewModalProps) {
  const html = blocksToHtml(data.contentBlocks);
  const wordCount = data.contentBlocks.reduce((acc, b) => acc + (b.content?.split(/\s+/).length || 0), 0);
  const estimatedReadTime = data.readingTime || Math.max(1, Math.ceil(wordCount / 200));
  const publishDate = data.publishedAt ? dayjs(data.publishedAt) : dayjs();

  // Build table of contents from headings
  const toc = data.contentBlocks
    .filter((b) => b.type === "h2" || b.type === "h3")
    .map((b, i) => ({ id: `toc-${i}`, level: b.type === "h2" ? 2 : 3, text: b.content }));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      centered={false}
      closable={false}
      style={{ top: 0, maxWidth: "100vw", padding: 0, margin: 0 }}
      styles={{
        body: { padding: 0, height: "100vh", overflow: "hidden" },
        mask: { background: "rgba(0,0,0,0.6)" },
        wrapper: { overflow: "hidden" },
      }}
    >
      {/* Full-screen blog layout */}
      <div style={{ height: "100vh", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>

        {/* Top navbar — mimics a real blog site */}
        <header style={{
          height: 56, minHeight: 56,
          background: "#fff",
          borderBottom: "1px solid #eee",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: -0.5 }}>
              Operis<span style={{ color: "#1890ff" }}>Blog</span>
            </span>
            <nav style={{ display: "flex", gap: 20 }}>
              {["Trang chủ", "Bài viết", "Hướng dẫn", "Liên hệ"].map((item) => (
                <span key={item} style={{ fontSize: 14, color: "#666", cursor: "default" }}>{item}</span>
              ))}
            </nav>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f5f5f5", border: "none", borderRadius: 8,
              width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#999",
            }}
          >
            <CloseOutlined />
          </button>
        </header>

        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fafafa" }}>

          {/* Hero section with cover image */}
          {data.coverImage ? (
            <div style={{
              position: "relative",
              width: "100%",
              height: 480,
              background: `url(${data.coverImage}) center/cover no-repeat`,
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: "48px 0",
              }}>
                <div style={{ maxWidth: 760, margin: "0 auto", width: "100%", padding: "0 24px" }}>
                  {data.categoryName && (
                    <span style={{
                      display: "inline-block",
                      background: "#1890ff", color: "#fff",
                      padding: "4px 14px", borderRadius: 20,
                      fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                      textTransform: "uppercase", marginBottom: 16,
                    }}>
                      {data.categoryName}
                    </span>
                  )}
                  <h1 style={{
                    color: "#fff", fontSize: 40, fontWeight: 800,
                    lineHeight: 1.25, margin: "0 0 12px",
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    fontFamily: "'Georgia', 'Noto Serif', serif",
                  }}>
                    {data.title || "Tiêu đề bài viết"}
                  </h1>
                  {data.subtitle && (
                    <p style={{
                      color: "rgba(255,255,255,0.85)", fontSize: 18,
                      lineHeight: 1.5, margin: 0,
                      fontFamily: "'Georgia', 'Noto Serif', serif",
                    }}>
                      {data.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* No cover image — text-only hero */
            <div style={{ background: "#111", padding: "64px 24px" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {data.categoryName && (
                  <span style={{
                    display: "inline-block",
                    background: "#1890ff", color: "#fff",
                    padding: "4px 14px", borderRadius: 20,
                    fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                    textTransform: "uppercase", marginBottom: 16,
                  }}>
                    {data.categoryName}
                  </span>
                )}
                <h1 style={{
                  color: "#fff", fontSize: 40, fontWeight: 800,
                  lineHeight: 1.25, margin: "0 0 12px",
                  fontFamily: "'Georgia', 'Noto Serif', serif",
                }}>
                  {data.title || "Tiêu đề bài viết"}
                </h1>
                {data.subtitle && (
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, lineHeight: 1.5, margin: 0 }}>
                    {data.subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Author bar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #eee" }}>
            <div style={{
              maxWidth: 760, margin: "0 auto", padding: "16px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar size={44} src={data.authorAvatar} icon={<UserOutlined />}
                  style={{ border: "2px solid #f0f0f0" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#111", lineHeight: 1.3 }}>
                    {data.authorName || "Tác giả"}
                  </div>
                  {data.authorJobTitle && (
                    <div style={{ fontSize: 13, color: "#888" }}>{data.authorJobTitle}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#999" }}>
                <span>{publishDate.format("DD [tháng] MM, YYYY")}</span>
                <span>·</span>
                <span>{estimatedReadTime} phút đọc</span>
                <span>·</span>
                <span>{wordCount.toLocaleString()} từ</span>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div style={{
            maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px",
            background: "#fff",
            minHeight: 400,
          }}>

            {/* Excerpt / Lead paragraph */}
            {data.excerpt && (
              <p style={{
                fontSize: 19, lineHeight: 1.8, color: "#444",
                fontFamily: "'Georgia', 'Noto Serif', serif",
                marginBottom: 32,
                paddingBottom: 32,
                borderBottom: "1px solid #eee",
              }}>
                {data.excerpt}
              </p>
            )}

            {/* Table of Contents */}
            {toc.length >= 3 && (
              <div style={{
                background: "#f8f9fa", borderRadius: 12,
                padding: "20px 24px", marginBottom: 36,
                border: "1px solid #e9ecef",
                maxHeight: 240, overflowY: "auto",
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: 1, color: "#888", marginBottom: 12,
                  position: "sticky", top: -20, background: "#f8f9fa",
                  paddingTop: 4, paddingBottom: 4,
                }}>
                  Mục lục
                </div>
                {toc.map((item) => (
                  <div key={item.id} style={{
                    padding: "5px 0",
                    paddingLeft: item.level === 3 ? 20 : 0,
                    fontSize: 14,
                    color: "#1890ff",
                    lineHeight: 1.6,
                    cursor: "default",
                  }}>
                    {item.level === 3 ? "— " : ""}{item.text}
                  </div>
                ))}
              </div>
            )}

            {/* Article content */}
            <div
              className="blog-preview-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* FAQ section */}
            {data.faq && data.faq.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 style={{
                  fontSize: 26, fontWeight: 700, color: "#111",
                  marginBottom: 24, paddingBottom: 12,
                  borderBottom: "2px solid #111",
                  fontFamily: "'Georgia', 'Noto Serif', serif",
                }}>
                  Câu hỏi thường gặp
                </h2>
                {data.faq.map((item, i) => (
                  <details key={i} style={{
                    marginBottom: 8, borderRadius: 8,
                    border: "1px solid #e9ecef",
                    overflow: "hidden",
                  }}>
                    <summary style={{
                      padding: "14px 20px",
                      fontWeight: 600, fontSize: 15, color: "#222",
                      cursor: "pointer", background: "#f8f9fa",
                      listStyle: "none",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "#1890ff", fontWeight: 700 }}>Q.</span>
                      {item.question}
                    </summary>
                    <div style={{
                      padding: "14px 20px", fontSize: 15,
                      lineHeight: 1.7, color: "#555",
                      borderTop: "1px solid #e9ecef",
                    }}>
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div style={{
                marginTop: 48, paddingTop: 24,
                borderTop: "1px solid #eee",
                display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "#999", fontWeight: 600, marginRight: 4 }}>TAGS</span>
                {data.tags.map((tag) => (
                  <span key={tag} style={{
                    display: "inline-block",
                    padding: "4px 14px", borderRadius: 20,
                    background: "#f0f0f0", color: "#555",
                    fontSize: 13, fontWeight: 500,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author bio card */}
            {data.authorName && (
              <div style={{
                marginTop: 48, padding: 24,
                background: "#f8f9fa", borderRadius: 12,
                display: "flex", gap: 16, alignItems: "center",
                border: "1px solid #e9ecef",
              }}>
                <Avatar size={64} src={data.authorAvatar} icon={<UserOutlined />}
                  style={{ flexShrink: 0, border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#999", marginBottom: 4 }}>
                    Tác giả
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#111" }}>{data.authorName}</div>
                  {data.authorJobTitle && (
                    <div style={{ fontSize: 14, color: "#666", marginTop: 2 }}>{data.authorJobTitle}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer style={{
            background: "#111", color: "#999",
            padding: "40px 24px",
            textAlign: "center", fontSize: 13,
          }}>
            <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              Operis<span style={{ color: "#1890ff" }}>Blog</span>
            </div>
            <div>© {dayjs().year()} Operis. Đây là bản xem trước — chưa xuất bản.</div>
          </footer>
        </div>
      </div>

      {/* Blog-like content styles */}
      <style jsx global>{`
        .blog-preview-content {
          font-size: 17px;
          line-height: 1.9;
          color: #333;
          font-family: 'Georgia', 'Noto Serif', 'Times New Roman', serif;
        }
        .blog-preview-content h1 {
          font-size: 32px; font-weight: 800;
          margin: 48px 0 20px; color: #111;
          line-height: 1.3;
        }
        .blog-preview-content h2 {
          font-size: 26px; font-weight: 700;
          margin: 40px 0 16px; color: #111;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
          line-height: 1.35;
        }
        .blog-preview-content h3 {
          font-size: 21px; font-weight: 600;
          margin: 32px 0 12px; color: #222;
          line-height: 1.4;
        }
        .blog-preview-content h4 {
          font-size: 18px; font-weight: 600;
          margin: 24px 0 10px; color: #333;
        }
        .blog-preview-content p {
          margin: 0 0 20px;
        }
        .blog-preview-content ul, .blog-preview-content ol {
          padding-left: 28px;
          margin: 0 0 20px;
        }
        .blog-preview-content li {
          margin-bottom: 8px;
          line-height: 1.7;
        }
        .blog-preview-content li::marker {
          color: #1890ff;
        }
        .blog-preview-content blockquote {
          border-left: 4px solid #1890ff;
          padding: 16px 24px;
          margin: 24px 0;
          background: #f0f7ff;
          color: #444;
          font-style: italic;
          border-radius: 0 8px 8px 0;
          font-size: 18px;
          line-height: 1.7;
        }
        .blog-preview-content blockquote p:last-child { margin-bottom: 0; }
        .blog-preview-content pre {
          background: #1a1b26;
          color: #a9b1d6;
          padding: 20px 24px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 24px 0;
          font-size: 14px;
          line-height: 1.7;
          font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          border: 1px solid #2a2b3d;
        }
        .blog-preview-content code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #e53e3e;
        }
        .blog-preview-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .blog-preview-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 24px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .blog-preview-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #ddd, transparent);
          margin: 40px 0;
        }
        .blog-preview-content a {
          color: #1890ff;
          text-decoration: none;
          border-bottom: 1px solid rgba(24,144,255,0.3);
          transition: border-color 0.2s;
        }
        .blog-preview-content a:hover {
          border-bottom-color: #1890ff;
        }
        .blog-preview-content strong { font-weight: 700; color: #111; }
        .blog-preview-content em { font-style: italic; }
        .blog-preview-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 15px;
        }
        .blog-preview-content th, .blog-preview-content td {
          padding: 12px 16px;
          border: 1px solid #e9ecef;
          text-align: left;
        }
        .blog-preview-content th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }
        .blog-preview-content tr:hover td {
          background: #fafafa;
        }

        /* Hide default Ant Modal close button since we have custom one */
        .ant-modal .ant-modal-close { display: none; }
      `}</style>
    </Modal>
  );
}
