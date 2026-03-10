"use client";

import { useState, useCallback } from "react";
import { Input, Select, Button, Tooltip, Typography, Dropdown } from "antd";
import {
  DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  PlusOutlined, CopyOutlined, MoreOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  BoldOutlined, ItalicOutlined, LinkOutlined,
  VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
} from "@ant-design/icons";
import { marked } from "marked";

const { TextArea } = Input;
const { Text } = Typography;

/* ===== Types ===== */
export type BlockType = "h1" | "h2" | "h3" | "h4" | "p" | "img" | "quote" | "code" | "ul" | "ol" | "hr" | "table";

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  alt?: string;
  link?: string;
  width?: string;
  height?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  className?: string;
}

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const TYPE_CONFIG: Record<BlockType, { label: string; color: string; bg: string }> = {
  h1:    { label: "H1",    color: "#fff", bg: "#531dab" },
  h2:    { label: "H2",    color: "#fff", bg: "#722ed1" },
  h3:    { label: "H3",    color: "#fff", bg: "#9254de" },
  h4:    { label: "H4",    color: "#fff", bg: "#b37feb" },
  p:     { label: "P",     color: "#fff", bg: "#1890ff" },
  img:   { label: "IMG",   color: "#fff", bg: "#13c2c2" },
  quote: { label: "Quote", color: "#fff", bg: "#fa8c16" },
  code:  { label: "Code",  color: "#fff", bg: "#434343" },
  ul:    { label: "UL",    color: "#fff", bg: "#52c41a" },
  ol:    { label: "OL",    color: "#fff", bg: "#52c41a" },
  hr:    { label: "HR",    color: "#666", bg: "#e8e8e8" },
  table: { label: "Table", color: "#fff", bg: "#597ef7" },
};

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }));

let _n = 0;
const uid = () => `blk_${Date.now()}_${++_n}`;

/* ===== Markdown/HTML → Blocks parser ===== */
export function parseToBlocks(input: string): ContentBlock[] {
  if (!input.trim()) return [];

  // Try HTML first
  if (/<[a-z][\s\S]*>/i.test(input)) {
    const blocks = parseHtml(input);
    if (blocks.length > 0) return blocks;
  }

  // Markdown / plain text
  return parseMarkdown(input);
}

function parseHtml(html: string): ContentBlock[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: ContentBlock[] = [];

  // Convert inline HTML nodes to our inline format (*bold*, [text](url))
  const inlineText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(inlineText).join("");
    if (tag === "strong" || tag === "b") return `*${children}*`;
    if (tag === "em" || tag === "i") return `*${children}*`;
    if (tag === "a") return `[${children}](${el.getAttribute("href") || ""})`;
    if (tag === "br") return "\n";
    if (tag === "code") return children;
    return children;
  };

  const blockInline = (el: Element) => Array.from(el.childNodes).map(inlineText).join("").trim();

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();

    if (tag === "h1") blocks.push({ id: uid(), type: "h1", content: blockInline(el) });
    else if (tag === "h2") blocks.push({ id: uid(), type: "h2", content: blockInline(el) });
    else if (tag === "h3") blocks.push({ id: uid(), type: "h3", content: blockInline(el) });
    else if (tag.match(/^h[4-6]$/)) blocks.push({ id: uid(), type: "h4", content: blockInline(el) });
    else if (tag === "img") {
      blocks.push({ id: uid(), type: "img", content: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "", width: el.getAttribute("width") || "", height: el.getAttribute("height") || "",
        link: el.closest("a")?.getAttribute("href") || "" });
    }
    else if (tag === "blockquote") blocks.push({ id: uid(), type: "quote", content: blockInline(el) });
    else if (tag === "pre") blocks.push({ id: uid(), type: "code", content: el.textContent?.trim() || "" });
    else if (tag === "ul") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map(l => blockInline(l));
      if (items.length) blocks.push({ id: uid(), type: "ul", content: items.join("\n") });
    }
    else if (tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map(l => blockInline(l));
      if (items.length) blocks.push({ id: uid(), type: "ol", content: items.join("\n") });
    }
    else if (tag === "table") {
      const trs = Array.from(el.querySelectorAll("tr"));
      const headerRow = trs[0];
      const header = headerRow
        ? Array.from(headerRow.querySelectorAll("th, td")).map(c => blockInline(c))
        : [];
      const rows = trs.slice(1).map(row =>
        Array.from(row.querySelectorAll("td, th")).map(c => blockInline(c))
      );
      blocks.push({ id: uid(), type: "table", content: JSON.stringify({ header, rows }) });
    }
    else if (tag === "hr") blocks.push({ id: uid(), type: "hr", content: "" });
    else if (["p", "div", "section", "article", "span", "figure"].includes(tag)) {
      const img = el.querySelector("img");
      if (img && (el.textContent?.trim() || "").length < 5) walk(img);
      else {
        const content = blockInline(el);
        if (content) blocks.push({ id: uid(), type: "p", content });
      }
    }
    else Array.from(el.children).forEach(walk);
  };

  Array.from(doc.body.children).forEach(walk);
  return blocks;
}

/* Vietnamese char classes for detecting lost newlines in pasted text */
const VN_LOWER = "a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
const VN_UPPER = "A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";

/* Clean pasted text & normalize for marked parser:
   - Strip clipboard artifacts (bullets, comments, dots)
   - Recover lost newlines in long lines (Vietnamese camelCase joins, sentence boundaries)
   - Convert single \n to \n\n so marked creates separate blocks */
function cleanPastedText(text: string): string {
  let s = text;
  s = s.replace(/^[•●]\t?/gm, "");         // macOS bullet prefix
  s = s.replace(/<!--[\s\S]*?-->/g, "");    // HTML comments
  s = s.replace(/\s*·\s*·\s*/g, "\n");      // middle dot separators
  s = s.replace(/\s*·\s*/g, "\n");

  // Escape hashtag lines so marked doesn't parse "#Word" as heading.
  // Lines like "#Operis #Tag #SEO" → keep as paragraph text
  s = s.replace(/^(#\w+(\s+#\w+)*)$/gm, (match) => match.replace(/#/g, "\\#"));

  // Recover lost newlines on long lines (>200 chars)
  const camelJoin = new RegExp(`([${VN_LOWER}])([${VN_UPPER}][${VN_LOWER}])`, "g");
  const sentenceBoundary = new RegExp(`([.?!])\\s+([${VN_UPPER}])`, "g");
  s = s.split("\n").map(line => {
    if (line.length <= 200) return line;
    let r = line.replace(camelJoin, "$1\n$2");
    r = r.replace(sentenceBoundary, "$1\n$2");
    return r;
  }).join("\n");

  // Ensure double newlines between paragraphs for marked to parse properly.
  // Don't double newlines inside code fences, tables, or list items.
  const lines = s.split("\n");
  const parts: string[] = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) inCode = !inCode;
    const isTable = trimmed.startsWith("|");
    const isList = /^(\d+[.)]\s|[-*+]\s)/.test(trimmed);
    const nextTrimmed = lines[i + 1]?.trim() ?? "";
    const nextIsTable = nextTrimmed.startsWith("|");
    const nextIsList = /^(\d+[.)]\s|[-*+]\s)/.test(nextTrimmed);
    if (inCode || (isTable && nextIsTable) || (isList && nextIsList)) {
      parts.push(line);
    } else {
      parts.push(line, "");
    }
  }
  s = parts.join("\n");

  // Clean up excessive blank lines (3+ → 2)
  s = s.replace(/\n{3,}/g, "\n\n");

  return s;
}

/* Extract inline text from marked tokens, preserving [link](url) and *bold* for blocksToHtml.
   marked tokens have nested structure: { type: "strong", tokens: [...] } etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tokensToInlineText(tokens: any[]): string {
  if (!tokens) return "";
  return tokens.map((t) => {
    if (t.type === "text") return t.tokens ? tokensToInlineText(t.tokens) : (t.text || "");
    if (t.type === "strong") return `*${tokensToInlineText(t.tokens)}*`;
    if (t.type === "em") return `*${tokensToInlineText(t.tokens)}*`;
    if (t.type === "link") return `[${tokensToInlineText(t.tokens)}](${t.href})`;
    if (t.type === "codespan") return t.text || "";
    if (t.type === "br") return "\n";
    if (t.type === "image") return `![${t.text}](${t.href})`;
    if (t.tokens) return tokensToInlineText(t.tokens);
    return t.raw || t.text || "";
  }).join("");
}

/* Parse markdown text into ContentBlocks using `marked` lexer.
   Handles: headings, paragraphs, lists, code, blockquotes, tables, images, HR */
export function parseMarkdown(text: string): ContentBlock[] {
  const cleaned = cleanPastedText(text);
  const tokens = marked.lexer(cleaned);
  const blocks: ContentBlock[] = [];

  for (const token of tokens) {
    if (token.type === "heading") {
      const depth = Math.min(token.depth, 4) as 1 | 2 | 3 | 4;
      blocks.push({ id: uid(), type: `h${depth}` as BlockType, content: tokensToInlineText(token.tokens || []) });
    }
    else if (token.type === "paragraph") {
      // Check if paragraph is just an image
      const imgMatch = token.text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        blocks.push({ id: uid(), type: "img", content: imgMatch[2], alt: imgMatch[1] });
      } else {
        blocks.push({ id: uid(), type: "p", content: tokensToInlineText(token.tokens || []) });
      }
    }
    else if (token.type === "list") {
      const type = token.ordered ? "ol" : "ul";
      const items = token.items.map((item: { tokens: unknown[] }) => tokensToInlineText(item.tokens).replace(/\n+$/, ""));
      blocks.push({ id: uid(), type, content: items.join("\n") });
    }
    else if (token.type === "code") {
      blocks.push({ id: uid(), type: "code", content: token.text });
    }
    else if (token.type === "blockquote") {
      const text = tokensToInlineText(token.tokens || []);
      blocks.push({ id: uid(), type: "quote", content: text });
    }
    else if (token.type === "table") {
      const headerCells = token.header.map((h: { tokens: unknown[] }) => tokensToInlineText(h.tokens));
      const rows = token.rows.map((row: { tokens: unknown[] }[]) =>
        row.map((c: { tokens: unknown[] }) => tokensToInlineText(c.tokens))
      );
      // Store as JSON: { header: string[], rows: string[][] }
      blocks.push({ id: uid(), type: "table", content: JSON.stringify({ header: headerCells, rows }) });
    }
    else if (token.type === "hr") {
      blocks.push({ id: uid(), type: "hr", content: "" });
    }
    else if (token.type === "html") {
      // Skip raw HTML blocks (JSON-LD script tags, etc.)
      const text = token.text.replace(/<[^>]+>/g, "").trim();
      if (text) blocks.push({ id: uid(), type: "p", content: text });
    }
    // Skip 'space' tokens (blank lines)
  }

  return blocks;
}

/* ===== Blocks → HTML (for saving) ===== */
export function blocksToHtml(blocks: ContentBlock[]): string {
  const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Convert markdown links [text](url) and auto-link bare URLs
  const aStyle = 'style="color:#1890ff;text-decoration:underline"';
  const linkify = (s: string) => {
    // First: markdown links [text](url)
    let r = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" ${aStyle}>$1</a>`);
    // Then: bare URLs not already inside href="..."
    r = r.replace(/(?<!href="|">)(https?:\/\/[^\s<"]+)/g, `<a href="$1" target="_blank" rel="noopener" ${aStyle}>$1</a>`);
    return r;
  };
  return blocks.map(b => {
    const alignStyle = b.align && b.align !== "left" ? ` style="text-align:${b.align}"` : "";
    const hashtagStyle = 'style="display:inline-block;background:#f0f0ff;color:#1890ff;padding:2px 8px;border-radius:12px;font-size:0.9em;font-weight:500;margin:0 2px"';
    const renderHashtags = (s: string) =>
      s.replace(/(?:^|\s)(\\?#)(\w[\w]*)/g, (m, hash, word) => {
        const prefix = m.startsWith(" ") ? " " : "";
        return `${prefix}<span ${hashtagStyle}>#${word}</span>`;
      });
    const inlineFmt = (s: string) => {
      let r = e(s);
      // Convert *text* to bold (non-greedy, handle adjacent)
      r = r.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
      // Convert reference-style links [text][ref] → just show text
      r = r.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
      r = linkify(r);
      r = renderHashtags(r);
      return r;
    };
    const wrapText = (text: string) => {
      let r = inlineFmt(text);
      if (b.bold) r = `<strong>${r}</strong>`;
      if (b.italic) r = `<em>${r}</em>`;
      return r;
    };
    const wrapListItem = (text: string) => inlineFmt(text);
    switch (b.type) {
      case "h1": case "h2": case "h3": case "h4": return `<${b.type}${alignStyle}>${wrapText(b.content)}</${b.type}>`;
      case "p": return `<p${alignStyle}>${wrapText(b.content)}</p>`;
      case "img": {
        const a: string[] = [`src="${b.content}"`, 'style="max-width:100%;height:auto;"'];
        if (b.alt) a.push(`alt="${b.alt}"`);
        if (b.width) a.push(`width="${b.width}"`);
        if (b.height) a.push(`height="${b.height}"`);
        const tag = `<img ${a.join(" ")} />`;
        return b.link ? `<a href="${b.link}" target="_blank">${tag}</a>` : tag;
      }
      case "quote": return `<blockquote${alignStyle}>${wrapText(b.content)}</blockquote>`;
      case "code": return `<pre><code>${e(b.content)}</code></pre>`;
      case "ul": return `<ul>${b.content.split("\n").filter(Boolean).map(i => `<li>${wrapListItem(i)}</li>`).join("")}</ul>`;
      case "ol": return `<ol>${b.content.split("\n").filter(Boolean).map(i => `<li>${wrapListItem(i)}</li>`).join("")}</ol>`;
      case "table": {
        try {
          const { header, rows } = JSON.parse(b.content) as { header: string[]; rows: string[][] };
          const thRow = header.map(h => `<th>${wrapListItem(h)}</th>`).join("");
          const bodyRows = rows.map(r => `<tr>${r.map(c => `<td>${wrapListItem(c)}</td>`).join("")}</tr>`).join("");
          return `<table><thead><tr>${thRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        } catch { return `<p>${e(b.content)}</p>`; }
      }
      case "hr": return "<hr />";
      default: return `<p>${e(b.content)}</p>`;
    }
  }).join("\n");
}

/* ===== Block Item Component ===== */
function BlockItem({ block, index, total, onUpdate, onDelete, onMove, onDuplicate, onChangeType, onInsertAfter }: {
  block: ContentBlock; index: number; total: number;
  onUpdate: (field: string, value: string | boolean) => void;
  onDelete: () => void; onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void; onChangeType: (t: BlockType) => void;
  onInsertAfter: (t: BlockType) => void;
}) {
  const cfg = TYPE_CONFIG[block.type];
  const [showImgOpts, setShowImgOpts] = useState(false);
  const isText = ["h1", "h2", "h3", "h4", "p", "quote"].includes(block.type);

  const renderInput = () => {
    if (block.type === "hr") return <div style={{ borderTop: "2px dashed #d9d9d9", margin: "8px 0" }} />;

    if (block.type === "img") return (
      <div>
        <Input size="small" value={block.content} onChange={e => onUpdate("content", e.target.value)}
          placeholder="URL hình ảnh..." style={{ marginBottom: 4 }} />
        {block.content && <img src={block.content} alt={block.alt} style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 6, marginTop: 4, objectFit: "contain" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
        <div style={{ marginTop: 4 }}>
          <Button size="small" type="link" onClick={() => setShowImgOpts(!showImgOpts)} style={{ padding: 0, fontSize: 12 }}>
            {showImgOpts ? "Ẩn tùy chọn" : "Tùy chọn ảnh (alt, link, size)"}
          </Button>
        </div>
        {showImgOpts && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
            <Input size="small" value={block.alt || ""} onChange={e => onUpdate("alt", e.target.value)} placeholder="Alt text" />
            <Input size="small" value={block.link || ""} onChange={e => onUpdate("link", e.target.value)} placeholder="Link URL" />
            <Input size="small" value={block.width || ""} onChange={e => onUpdate("width", e.target.value)} placeholder="Width (px)" />
            <Input size="small" value={block.height || ""} onChange={e => onUpdate("height", e.target.value)} placeholder="Height (px)" />
          </div>
        )}
      </div>
    );

    if (block.type === "code") return (
      <TextArea value={block.content} onChange={e => onUpdate("content", e.target.value)}
        autoSize={{ minRows: 2 }} placeholder="Code..."
        style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, background: "#1e1e2e", color: "#cdd6f4", border: "none", borderRadius: 6 }} />
    );

    if (block.type === "table") {
      let tableData = { header: [""], rows: [[""]] };
      try { tableData = JSON.parse(block.content); } catch { /* keep default */ }
      const updateTable = (d: typeof tableData) => onUpdate("content", JSON.stringify(d));
      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {tableData.header.map((h, ci) => (
                  <th key={ci} style={{ border: "1px solid #d9d9d9", padding: 4, background: "#f5f5f5" }}>
                    <Input size="small" value={h} style={{ border: "none", fontWeight: 600, background: "transparent" }}
                      onChange={e => { const nh = [...tableData.header]; nh[ci] = e.target.value; updateTable({ ...tableData, header: nh }); }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ border: "1px solid #d9d9d9", padding: 4 }}>
                      <Input size="small" value={cell} style={{ border: "none", background: "transparent" }}
                        onChange={e => { const nr = tableData.rows.map(r => [...r]); nr[ri][ci] = e.target.value; updateTable({ ...tableData, rows: nr }); }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (block.type === "ul" || block.type === "ol") return (
      <TextArea value={block.content} onChange={e => onUpdate("content", e.target.value)}
        autoSize={{ minRows: 2 }} placeholder={"Mỗi dòng = 1 item\nItem 1\nItem 2\nItem 3"} />
    );

    const textStyle: React.CSSProperties = {
      fontWeight: block.bold ? 700 : block.type.startsWith("h") ? 700 : undefined,
      fontStyle: block.italic ? "italic" : undefined,
      textAlign: block.align || "left",
    };

    if (block.type.startsWith("h")) return (
      <Input value={block.content} onChange={e => onUpdate("content", e.target.value)} placeholder="Heading..."
        style={{ ...textStyle, fontSize: block.type === "h1" ? 22 : block.type === "h2" ? 19 : block.type === "h3" ? 16 : 15, border: "none", boxShadow: "none", padding: "4px 0" }} />
    );

    if (block.type === "quote") return (
      <TextArea value={block.content} onChange={e => onUpdate("content", e.target.value)}
        autoSize={{ minRows: 1 }} placeholder="Trích dẫn..."
        style={{ ...textStyle, borderLeft: "3px solid #fa8c16", paddingLeft: 12 }} />
    );

    return (
      <TextArea value={block.content} onChange={e => onUpdate("content", e.target.value)}
        autoSize={{ minRows: 1 }} placeholder="Nội dung..."
        style={{ ...textStyle, border: "none", boxShadow: "none", padding: "4px 0", resize: "none" }} />
    );
  };

  const insertMenuItems = [
    { key: "p", label: "Paragraph" },
    { key: "h2", label: "Heading 2" },
    { key: "h3", label: "Heading 3" },
    { key: "h4", label: "Heading 4" },
    { key: "img", label: "Image" },
    { key: "ul", label: "Bullet List" },
    { key: "ol", label: "Numbered List" },
    { key: "quote", label: "Quote" },
    { key: "code", label: "Code" },
    { key: "hr", label: "Divider" },
  ];

  const moreMenuItems = [
    { key: "dup", label: "Nhân đôi block", icon: <CopyOutlined /> },
    { key: "move-top", label: "Di chuyển lên đầu", icon: <VerticalAlignTopOutlined /> },
    { key: "move-bottom", label: "Di chuyển xuống cuối", icon: <VerticalAlignBottomOutlined /> },
    { type: "divider" as const },
    { key: "to-h1", label: "Chuyển → H1" },
    { key: "to-h2", label: "Chuyển → H2" },
    { key: "to-h3", label: "Chuyển → H3" },
    { key: "to-p", label: "Chuyển → Paragraph" },
    { key: "to-quote", label: "Chuyển → Quote" },
    { key: "to-code", label: "Chuyển → Code" },
    { type: "divider" as const },
    { key: "delete", label: "Xóa block", icon: <DeleteOutlined />, danger: true },
  ];

  return (
    <div className="block-item" style={{
      borderRadius: 8, border: "1px solid #f0f0f0", background: "#fff",
      marginBottom: 6, overflow: "hidden", transition: "all 0.15s",
    }}>
      {/* Top toolbar — horizontal */}
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "4px 8px",
        background: "#fafafa", borderBottom: "1px solid #f0f0f0",
        flexWrap: "wrap",
      }}>
        {/* Type badge */}
        <div style={{
          background: cfg.bg, color: cfg.color, borderRadius: 4,
          fontSize: 10, fontWeight: 700, padding: "1px 8px", lineHeight: "18px",
          marginRight: 4, cursor: "default", userSelect: "none",
        }}>{cfg.label}</div>

        {/* Type selector */}
        <Select size="small" value={block.type} onChange={onChangeType} options={TYPE_OPTIONS}
          style={{ width: 80 }} variant="borderless" />

        <div style={{ width: 1, height: 16, background: "#e8e8e8", margin: "0 2px" }} />

        {/* Move up/down */}
        <Tooltip title="Lên"><Button size="small" type="text" disabled={index === 0} onClick={() => onMove(-1)} icon={<ArrowUpOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} /></Tooltip>
        <Tooltip title="Xuống"><Button size="small" type="text" disabled={index === total - 1} onClick={() => onMove(1)} icon={<ArrowDownOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} /></Tooltip>

        <div style={{ width: 1, height: 16, background: "#e8e8e8", margin: "0 2px" }} />

        {/* Text formatting — only for text blocks */}
        {isText && (
          <>
            <Tooltip title="Bold">
              <Button size="small" type={block.bold ? "primary" : "text"} onClick={() => onUpdate("bold", !block.bold)}
                icon={<BoldOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>
            <Tooltip title="Italic">
              <Button size="small" type={block.italic ? "primary" : "text"} onClick={() => onUpdate("italic", !block.italic)}
                icon={<ItalicOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>

            <div style={{ width: 1, height: 16, background: "#e8e8e8", margin: "0 2px" }} />

            <Tooltip title="Trái">
              <Button size="small" type={(!block.align || block.align === "left") ? "primary" : "text"}
                onClick={() => onUpdate("align", "left")} icon={<AlignLeftOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>
            <Tooltip title="Giữa">
              <Button size="small" type={block.align === "center" ? "primary" : "text"}
                onClick={() => onUpdate("align", "center")} icon={<AlignCenterOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>
            <Tooltip title="Phải">
              <Button size="small" type={block.align === "right" ? "primary" : "text"}
                onClick={() => onUpdate("align", "right")} icon={<AlignRightOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>

            <div style={{ width: 1, height: 16, background: "#e8e8e8", margin: "0 2px" }} />
          </>
        )}

        {/* Image link shortcut */}
        {block.type === "img" && (
          <>
            <Tooltip title="Tùy chọn ảnh">
              <Button size="small" type={showImgOpts ? "primary" : "text"} onClick={() => setShowImgOpts(!showImgOpts)}
                icon={<LinkOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
            </Tooltip>
            <div style={{ width: 1, height: 16, background: "#e8e8e8", margin: "0 2px" }} />
          </>
        )}

        {/* Duplicate */}
        <Tooltip title="Nhân đôi">
          <Button size="small" type="text" onClick={onDuplicate} icon={<CopyOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
        </Tooltip>

        {/* Insert after */}
        <Dropdown menu={{ items: insertMenuItems, onClick: ({ key }) => onInsertAfter(key as BlockType) }} trigger={["click"]}>
          <Tooltip title="Thêm block phía dưới">
            <Button size="small" type="text" icon={<PlusOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
          </Tooltip>
        </Dropdown>

        {/* More options dropdown */}
        <Dropdown menu={{
          items: moreMenuItems,
          onClick: ({ key }) => {
            if (key === "dup") onDuplicate();
            else if (key === "move-top") onMove(-index as -1 | 1);
            else if (key === "move-bottom") onMove((total - 1 - index) as -1 | 1);
            else if (key === "delete") onDelete();
            else if (key.startsWith("to-")) onChangeType(key.replace("to-", "") as BlockType);
          },
        }} trigger={["click"]}>
          <Button size="small" type="text" icon={<MoreOutlined style={{ fontSize: 14 }} />} style={{ width: 28, height: 24 }} />
        </Dropdown>

        {/* Spacer + Delete on right */}
        <div style={{ flex: 1 }} />
        <Tooltip title="Xóa">
          <Button size="small" type="text" danger onClick={onDelete} icon={<DeleteOutlined style={{ fontSize: 12 }} />} style={{ width: 28, height: 24 }} />
        </Tooltip>
      </div>

      {/* Content area */}
      <div style={{ padding: "8px 12px", minWidth: 0 }}>
        {renderInput()}
      </div>
    </div>
  );
}

/* ===== Main Block Editor ===== */
export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [pasteValue, setPasteValue] = useState("");

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (!html && !text) return;

    // If HTML contains rich tags (headings, lists, images, etc.), use HTML parser.
    // Otherwise fall back to markdown/plain text parser.
    const hasRichHtml = html && /<(h[1-6]|ul|ol|li|img|blockquote|pre|table|figure)\b/i.test(html);
    let parsed = hasRichHtml ? parseHtml(html) : text ? parseMarkdown(text) : parseHtml(html);

    // Filter out noise blocks (just "#" chars, empty content, whitespace-only)
    parsed = parsed.filter(b => {
      if (b.type === "hr") return true;
      const c = b.content.trim();
      return c && !/^#+$/.test(c);
    });

    if (parsed.length) { onChange([...blocks, ...parsed]); setPasteValue(""); }
  }, [blocks, onChange]);

  const handleManualParse = () => {
    if (!pasteValue.trim()) return;
    const parsed = parseToBlocks(pasteValue);
    if (parsed.length) { onChange([...blocks, ...parsed]); setPasteValue(""); }
  };

  const update = useCallback((i: number, field: string, val: string | boolean) => {
    const u = [...blocks]; u[i] = { ...u[i], [field]: val }; onChange(u);
  }, [blocks, onChange]);

  const remove = useCallback((i: number) => onChange(blocks.filter((_, j) => j !== i)), [blocks, onChange]);

  const move = useCallback((i: number, d: number) => {
    const ni = i + d;
    if (ni < 0 || ni >= blocks.length) return;
    const u = [...blocks];
    const [item] = u.splice(i, 1);
    u.splice(ni, 0, item);
    onChange(u);
  }, [blocks, onChange]);

  const dup = useCallback((i: number) => {
    const u = [...blocks]; u.splice(i + 1, 0, { ...blocks[i], id: uid() }); onChange(u);
  }, [blocks, onChange]);

  const changeType = useCallback((i: number, t: BlockType) => {
    const u = [...blocks]; u[i] = { ...u[i], type: t }; onChange(u);
  }, [blocks, onChange]);

  const insertAfter = useCallback((i: number, type: BlockType) => {
    const u = [...blocks]; u.splice(i + 1, 0, { id: uid(), type, content: "" }); onChange(u);
  }, [blocks, onChange]);

  const addBlock = (type: BlockType = "p") => onChange([...blocks, { id: uid(), type, content: "" }]);

  return (
    <div>
      {/* Paste zone */}
      <div style={{
        background: "linear-gradient(135deg, #f0f0ff 0%, #f5f5f5 100%)",
        border: "2px dashed #d4d4f7", borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "center",
      }}>
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
          Paste nội dung vào đây (Markdown, HTML, hoặc plain text) — tự động tách thành blocks
        </Text>
        <TextArea
          value={pasteValue}
          onChange={e => setPasteValue(e.target.value)}
          onPaste={handlePaste}
          placeholder="Ctrl+V / Cmd+V paste nội dung..."
          rows={3}
          style={{ maxWidth: 600, margin: "0 auto", borderRadius: 8, fontSize: 14 }}
        />
        {pasteValue && (
          <div style={{ marginTop: 8 }}>
            <Button type="primary" onClick={handleManualParse} style={{ borderRadius: 6 }}>
              Parse thành blocks
            </Button>
          </div>
        )}
      </div>

      {/* Block count + clear */}
      {blocks.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{blocks.length} blocks</Text>
          <Button size="small" type="text" danger onClick={() => onChange([])} style={{ fontSize: 12 }}>Xóa tất cả</Button>
        </div>
      )}

      {/* Blocks list */}
      {blocks.map((block, i) => (
        <BlockItem key={block.id} block={block} index={i} total={blocks.length}
          onUpdate={(f, v) => update(i, f, v)}
          onDelete={() => remove(i)}
          onMove={d => move(i, d)}
          onDuplicate={() => dup(i)}
          onChangeType={t => changeType(i, t)}
          onInsertAfter={t => insertAfter(i, t)} />
      ))}

      {/* Add block */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => addBlock("p")} style={{ borderRadius: 6 }}>Paragraph</Button>
        <Button size="small" onClick={() => addBlock("h2")} style={{ borderRadius: 6 }}>+ H2</Button>
        <Button size="small" onClick={() => addBlock("h3")} style={{ borderRadius: 6 }}>+ H3</Button>
        <Button size="small" onClick={() => addBlock("img")} style={{ borderRadius: 6 }}>+ Image</Button>
        <Button size="small" onClick={() => addBlock("ul")} style={{ borderRadius: 6 }}>+ List</Button>
        <Button size="small" onClick={() => addBlock("quote")} style={{ borderRadius: 6 }}>+ Quote</Button>
        <Button size="small" onClick={() => addBlock("code")} style={{ borderRadius: 6 }}>+ Code</Button>
        <Button size="small" onClick={() => addBlock("hr")} style={{ borderRadius: 6 }}>+ HR</Button>
      </div>

      <style jsx global>{`
        .block-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #d9d9d9 !important; }
      `}</style>
    </div>
  );
}
