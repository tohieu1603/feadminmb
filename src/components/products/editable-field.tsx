"use client";

import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { Input, InputNumber, Select } from "antd";
import { EditOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface EditableFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  type?: "text" | "textarea" | "number" | "select" | "tags";
  options?: { label: string; value: string }[];
  render?: (value: unknown) => ReactNode;
  placeholder?: string;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
  min?: number;
  max?: number;
}

export function EditableField({
  value,
  onChange,
  type = "text",
  options,
  render,
  placeholder = "Click để sửa",
  style,
  inputStyle,
  min,
  max,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setLocalValue(value);
  };

  if (editing) {
    switch (type) {
      case "textarea":
        return (
          <TextArea
            autoFocus
            value={localValue as string}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Escape" && handleCancel()}
            autoSize={{ minRows: 2, maxRows: 10 }}
            style={inputStyle}
          />
        );
      case "number":
        return (
          <InputNumber
            value={localValue as number}
            onChange={(v) => setLocalValue(v)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            min={min}
            max={max}
            autoFocus
            style={{ width: "100%", ...inputStyle }}
          />
        );
      case "select":
        return (
          <Select
            value={localValue as string}
            onChange={(v) => {
              setLocalValue(v);
              onChange(v);
              setEditing(false);
            }}
            onBlur={() => setEditing(false)}
            options={options}
            style={{ minWidth: 150, ...inputStyle }}
            autoFocus
          />
        );
      case "tags":
        return (
          <Select
            mode="tags"
            value={(localValue as string[]) || []}
            onChange={(v) => setLocalValue(v)}
            onBlur={() => {
              onChange(localValue);
              setEditing(false);
            }}
            style={{ minWidth: 200, ...inputStyle }}
            autoFocus
          />
        );
      default:
        return (
          <Input
            autoFocus
            value={localValue as string}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onPressEnter={handleSave}
            onKeyDown={(e) => e.key === "Escape" && handleCancel()}
            style={inputStyle}
          />
        );
    }
  }

  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  const displayValue = render ? render(value) : isEmpty ? null : String(value);

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: "pointer",
        borderRadius: 4,
        padding: "2px 6px",
        margin: "-2px -6px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(24, 144, 255, 0.04)",
        border: "1px dashed rgba(24, 144, 255, 0.25)",
        transition: "all 0.15s",
        ...style,
      }}
    >
      {isEmpty ? (
        <span style={{ color: "#bbb", fontStyle: "italic" }}>{placeholder}</span>
      ) : (
        displayValue
      )}
      <EditOutlined
        style={{
          fontSize: 12,
          color: "#1890ff",
          opacity: 0.5,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
