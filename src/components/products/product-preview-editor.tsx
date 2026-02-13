"use client";

import { useState, useCallback } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Image,
  Tabs,
  Tag,
  Row,
  Col,
  Rate,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  AppstoreOutlined,
  TagOutlined,
  PlusOutlined,
  GiftOutlined,
  DeleteOutlined,
  SettingOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Product, ProductFullSpec } from "@/types";
import { EditableField } from "@/components/products/editable-field";

const { Title, Text } = Typography;

/** Sortable row for a single spec inside a group */
function SortableSpecRow({
  id,
  spec,
  isLast,
  onUpdateLabel,
  onUpdateValue,
  onRemove,
}: {
  id: string;
  spec: { label: string; value: string; _index: number };
  isLast: boolean;
  onUpdateLabel: (val: string) => void;
  onUpdateValue: (val: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
        gap: 8,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? "#fafafa" : "transparent",
      }}
    >
      {/* Drag handle */}
      <HolderOutlined
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", color: "#bbb", fontSize: 16, flexShrink: 0 }}
      />
      {/* Label */}
      <div style={{ width: 180, flexShrink: 0 }}>
        <EditableField
          value={spec.label}
          onChange={(val) => onUpdateLabel(val as string)}
          render={(v) => (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {v as string}
            </Text>
          )}
        />
      </div>
      {/* Value */}
      <div style={{ flex: 1 }}>
        <EditableField
          value={spec.value}
          onChange={(val) => onUpdateValue(val as string)}
          render={(v) => (
            <Text strong style={{ fontSize: 13 }}>
              {v as string}
            </Text>
          )}
        />
      </div>
      {/* Delete */}
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={onRemove}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
}

const formatPrice = (value: number | undefined) =>
  value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";

// Default empty product for create mode
const emptyProduct: Product = {
  id: "",
  slug: "",
  name: "",
  price: 0,
  brand: "Operis",
  stock: 0,
  rating: 0,
  createdAt: new Date().toISOString(),
  fullSpecs: [],
  specs: [],
  tags: [],
};

interface ProductPreviewEditorProps {
  /** Product data for edit mode. Omit for create mode. */
  product?: Product | null;
  /** Called when user clicks save. Receives API-formatted data. */
  onSave: (data: Record<string, unknown>) => Promise<void>;
  /** Loading state for save button */
  saving?: boolean;
  /** Available categories for the dropdown */
  categories?: string[];
  /** Label for the save button */
  saveLabel?: string;
}

/** Converts local product state to API request format (snake_case) */
function toApiData(local: Product): Record<string, unknown> {
  return {
    name: local.name,
    slug: local.slug || undefined,
    price: local.price,
    image: local.image || "",
    category: local.category || "",
    brand: local.brand,
    stock: local.stock,
    sku: local.sku || "",
    description: local.description || "",
    token_bonus: local.tokenBonus || 0,
    tags: local.tags || [],
    specs:
      local.specs?.map((s) => ({
        value: s.value,
        sort_order: s.sortOrder,
      })) || [],
    full_specs:
      local.fullSpecs?.map((s, i) => ({
        group_name: s.groupName || "",
        label: s.label,
        value: s.value,
        sort_order: i,
      })) || [],
  };
}

export function ProductPreviewEditor({
  product,
  onSave,
  saving,
  categories,
  saveLabel = "Lưu thay đổi",
}: ProductPreviewEditorProps) {
  const isCreate = !product;
  const initial = product || emptyProduct;

  const [local, setLocal] = useState<Product>({ ...initial });
  const [hasChanges, setHasChanges] = useState(isCreate);
  const [syncedId, setSyncedId] = useState(product?.id);

  // Sync local state when product prop changes
  if (product && product.id !== syncedId) {
    setSyncedId(product.id);
    setLocal({ ...product });
    setHasChanges(false);
  }

  const updateField = useCallback(
    <K extends keyof Product>(field: K, value: Product[K]) => {
      setLocal((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    [],
  );

  const handleSave = async () => {
    await onSave(toApiData(local));
    if (!isCreate) setHasChanges(false);
  };

  const handleReset = () => {
    setLocal({ ...initial });
    setHasChanges(isCreate);
  };

  // Spec helpers
  const updateSpec = useCallback(
    (index: number, field: keyof ProductFullSpec, value: string | number) => {
      setLocal((prev) => {
        const newSpecs = [...(prev.fullSpecs || [])];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        return { ...prev, fullSpecs: newSpecs };
      });
      setHasChanges(true);
    },
    [],
  );

  const addSpec = useCallback((groupName?: string) => {
    setLocal((prev) => {
      const newSpecs = [...(prev.fullSpecs || [])];
      newSpecs.push({
        groupName: groupName || "",
        label: "Thông số mới",
        value: "Giá trị",
        sortOrder: newSpecs.length,
      });
      return { ...prev, fullSpecs: newSpecs };
    });
    setHasChanges(true);
  }, []);

  const addGroup = useCallback(() => {
    setLocal((prev) => {
      const newSpecs = [...(prev.fullSpecs || [])];
      newSpecs.push({
        groupName: "Nhóm mới",
        label: "Thông số",
        value: "Giá trị",
        sortOrder: newSpecs.length,
      });
      return { ...prev, fullSpecs: newSpecs };
    });
    setHasChanges(true);
  }, []);

  const removeSpec = useCallback((index: number) => {
    setLocal((prev) => {
      const newSpecs = [...(prev.fullSpecs || [])];
      newSpecs.splice(index, 1);
      return { ...prev, fullSpecs: newSpecs };
    });
    setHasChanges(true);
  }, []);

  const moveSpec = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setLocal((prev) => {
      const newSpecs = [...(prev.fullSpecs || [])];
      const [moved] = newSpecs.splice(fromIndex, 1);
      newSpecs.splice(toIndex, 0, moved);
      return { ...prev, fullSpecs: newSpecs };
    });
    setHasChanges(true);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Only show hardware/performance specs in the card grid
  const GRID_GROUPS = ["phần cứng", "hiệu năng"];
  const gridSpecs = (local.fullSpecs || [])
    .map((s, i) => ({ ...s, _origIndex: i }))
    .filter((s) => GRID_GROUPS.includes((s.groupName || "").toLowerCase()));

  return (
    <>
      {/* Main Product Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[32, 24]}>
          {/* Left - Image */}
          <Col xs={24} md={10}>
            <div
              style={{
                background: "#f5f5f5",
                borderRadius: 8,
                padding: 16,
                textAlign: "center",
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {local.image ? (
                <Image
                  src={local.image}
                  alt={local.name}
                  style={{ maxHeight: 400, objectFit: "contain" }}
                />
              ) : (
                <div style={{ padding: 80, color: "#ccc", fontSize: 16 }}>
                  Chưa có ảnh
                </div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                URL ảnh:
              </Text>
              <EditableField
                value={local.image}
                onChange={(v) => updateField("image", v as string)}
                placeholder="Nhập URL ảnh"
                style={{ display: "flex", marginTop: 4 }}
              />
            </div>
          </Col>

          {/* Right - Product Info */}
          <Col xs={24} md={14}>
            {/* Name */}
            <EditableField
              value={local.name}
              onChange={(v) => updateField("name", v as string)}
              render={(v) => (
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {(v as string) || "TÊN SẢN PHẨM"}
                </Title>
              )}
              placeholder="Nhập tên sản phẩm"
              style={{ marginBottom: 8 }}
            />

            {/* Slug (create only) */}
            {isCreate && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Slug (tự sinh nếu để trống):
                </Text>
                <EditableField
                  value={local.slug}
                  onChange={(v) => updateField("slug", v as string)}
                  placeholder="vd: operisbot-enterprise"
                  style={{ display: "flex", marginTop: 2 }}
                />
              </div>
            )}

            {/* Rating */}
            <div style={{ marginBottom: 12 }}>
              <Rate
                value={local.rating}
                disabled
                allowHalf
                style={{ fontSize: 14 }}
              />
              <Text style={{ marginLeft: 8, color: "#faad14" }}>
                {local.rating}
              </Text>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 4 }}>
              <EditableField
                value={local.price}
                onChange={(v) => updateField("price", v as number)}
                type="number"
                min={0}
                render={(v) => (
                  <Title level={4} style={{ margin: 0, color: "#c41d7f" }}>
                    {(v as number) > 0
                      ? `${formatPrice(v as number)} ₫`
                      : "Liên hệ"}
                  </Title>
                )}
              />
            </div>

            {/* Token Bonus */}
            <div style={{ marginBottom: 16 }}>
              <GiftOutlined style={{ color: "#52c41a", marginRight: 6 }} />
              <Text type="secondary">Token Bonus: </Text>
              <EditableField
                value={local.tokenBonus}
                onChange={(v) => updateField("tokenBonus", (v as number) || 0)}
                type="number"
                min={0}
                render={(v) => (
                  <Text strong style={{ color: "#52c41a" }}>
                    +{formatPrice(v as number)}
                  </Text>
                )}
                placeholder="0"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <EditableField
                value={local.description}
                onChange={(v) => updateField("description", v as string)}
                type="textarea"
                render={(v) => {
                  const text = (v as string) || "";
                  return (
                    <Text style={{ color: "#555", lineHeight: 1.6 }}>
                      {text.substring(0, 200)}
                      {text.length > 200 ? "..." : ""}
                    </Text>
                  );
                }}
                placeholder="Thêm mô tả sản phẩm"
              />
            </div>

            {/* Specs Grid (read-only preview, edit in THÔNG SỐ KỸ THUẬT tab) */}
            {gridSpecs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <Row gutter={[12, 12]}>
                  {gridSpecs.map((spec) => (
                    <Col xs={12} sm={8} key={spec._origIndex}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: 8,
                          border: "1px solid #e8e8e8",
                          height: "100%",
                        }}
                        styles={{ body: { padding: "12px 16px" } }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <AppstoreOutlined
                            style={{ color: "#8c8c8c", fontSize: 14 }}
                          />
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {spec.label}
                          </Text>
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#333",
                            lineHeight: 1.4,
                          }}
                        >
                          {spec.value}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Stock */}
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: (local.stock || 0) > 0 ? "#52c41a" : "#ff4d4f",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <Text>Còn</Text>
              <EditableField
                value={local.stock}
                onChange={(v) => updateField("stock", (v as number) || 0)}
                type="number"
                min={0}
                render={(v) => <Text strong>{v as number}</Text>}
              />
              <Text>sản phẩm</Text>
            </div>

            {/* SKU */}
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AppstoreOutlined style={{ color: "#999" }} />
              <Text type="secondary">SKU:</Text>
              <EditableField
                value={local.sku}
                onChange={(v) => updateField("sku", v as string)}
                render={(v) => <Text strong>{v as string}</Text>}
                placeholder="Thêm SKU"
              />
            </div>

            {/* Category */}
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AppstoreOutlined style={{ color: "#999" }} />
              <Text type="secondary">Danh mục:</Text>
              <EditableField
                value={local.category}
                onChange={(v) => updateField("category", v as string)}
                type="select"
                options={categories?.map((c) => ({ label: c, value: c })) || []}
                render={(v) => (v ? <Tag>{v as string}</Tag> : null)}
                placeholder="Chọn danh mục"
              />
            </div>

            {/* Brand */}
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AppstoreOutlined style={{ color: "#999" }} />
              <Text type="secondary">Thương hiệu:</Text>
              <EditableField
                value={local.brand}
                onChange={(v) => updateField("brand", v as string)}
                render={(v) => <Text strong>{v as string}</Text>}
                placeholder="Thêm thương hiệu"
              />
            </div>

            {/* Tags */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <TagOutlined style={{ color: "#999" }} />
              <EditableField
                value={local.tags}
                onChange={(v) => updateField("tags", v as string[])}
                type="tags"
                render={(v) => (
                  <Space wrap size={4}>
                    {((v as string[]) || []).map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                )}
                placeholder="Thêm tags"
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Bottom Tabs */}
      <Card>
        <Tabs
          items={[
            {
              key: "description",
              label: "MÔ TẢ",
              children: (
                <div style={{ padding: "16px 0" }}>
                  <EditableField
                    value={local.description}
                    onChange={(v) => updateField("description", v as string)}
                    type="textarea"
                    render={(v) => (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.8,
                          color: "#555",
                        }}
                      >
                        {(v as string) || "Chưa có mô tả"}
                      </div>
                    )}
                    placeholder="Thêm mô tả chi tiết"
                  />

                  {/* Specs grid preview (same filter as main card) */}
                  {gridSpecs.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Row gutter={[12, 12]}>
                        {gridSpecs.map((spec) => (
                          <Col xs={12} sm={8} key={spec._origIndex}>
                            <Card
                              size="small"
                              style={{
                                borderRadius: 8,
                                border: "1px solid #e8e8e8",
                              }}
                              styles={{ body: { padding: "12px 16px" } }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 4,
                                }}
                              >
                                <AppstoreOutlined
                                  style={{ color: "#8c8c8c", fontSize: 14 }}
                                />
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 11,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {spec.label}
                                </Text>
                              </div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#333",
                                  lineHeight: 1.4,
                                }}
                              >
                                {spec.value}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "specs",
              label: "THÔNG SỐ KỸ THUẬT",
              children: (
                <div style={{ padding: "16px 0" }}>
                  {(() => {
                    // Group specs by groupName, preserving original indices
                    const indexed = (local.fullSpecs || []).map((s, i) => ({ ...s, _index: i }));
                    const groupOrder: string[] = [];
                    const groups: Record<string, typeof indexed> = {};
                    for (const s of indexed) {
                      const g = s.groupName || "Khác";
                      if (!groups[g]) {
                        groups[g] = [];
                        groupOrder.push(g);
                      }
                      groups[g].push(s);
                    }

                    const handleDragEnd = (event: DragEndEvent) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id) return;
                      const fromIndex = Number(String(active.id).split("-")[1]);
                      const toIndex = Number(String(over.id).split("-")[1]);
                      moveSpec(fromIndex, toIndex);
                    };

                    return (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        {groupOrder.map((groupName) => {
                          const specIds = groups[groupName].map((s) => `spec-${s._index}`);
                          return (
                            <Card
                              key={groupName}
                              size="small"
                              style={{
                                marginBottom: 16,
                                borderRadius: 8,
                                overflow: "hidden",
                              }}
                              styles={{
                                header: {
                                  background: "#1a1a2e",
                                  borderBottom: "none",
                                  padding: "10px 16px",
                                  minHeight: "auto",
                                },
                                body: { padding: 0 },
                              }}
                              title={
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <SettingOutlined style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }} />
                                  <EditableField
                                    value={groupName}
                                    onChange={(val) => {
                                      for (const s of groups[groupName]) {
                                        updateSpec(s._index, "groupName", val as string);
                                      }
                                    }}
                                    render={(v) => (
                                      <Text strong style={{ color: "#fff", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                                        {v as string}
                                      </Text>
                                    )}
                                    style={{ border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                                  />
                                </div>
                              }
                            >
                              <SortableContext items={specIds} strategy={verticalListSortingStrategy}>
                                {groups[groupName].map((spec, specIdx) => (
                                  <SortableSpecRow
                                    key={spec._index}
                                    id={`spec-${spec._index}`}
                                    spec={spec}
                                    isLast={specIdx === groups[groupName].length - 1}
                                    onUpdateLabel={(val) => updateSpec(spec._index, "label", val)}
                                    onUpdateValue={(val) => updateSpec(spec._index, "value", val)}
                                    onRemove={() => removeSpec(spec._index)}
                                  />
                                ))}
                              </SortableContext>
                              {/* Add spec to this group */}
                              <div style={{ padding: "8px 16px" }}>
                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => addSpec(groupName)}
                                  block
                                >
                                  Thêm thông số
                                </Button>
                              </div>
                            </Card>
                          );
                        })}

                        {/* Add new group */}
                        <Button
                          type="dashed"
                          onClick={addGroup}
                          icon={<PlusOutlined />}
                          block
                        >
                          Thêm nhóm thông số mới
                        </Button>
                      </DndContext>
                    );
                  })()}
                </div>
              ),
            },
            {
              key: "reviews",
              label: "ĐÁNH GIÁ & HỎI ĐÁP",
              children: (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  Chưa có đánh giá nào
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Floating save bar */}
      {hasChanges && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: "flex",
            gap: 8,
            background: "rgba(255,255,255,0.95)",
            padding: "12px 16px",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          <Button
            shape="round"
            icon={<UndoOutlined />}
            onClick={handleReset}
            size="large"
          >
            Hoàn tác
          </Button>
          <Button
            type="primary"
            shape="round"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            size="large"
          >
            {saveLabel}
          </Button>
        </div>
      )}
    </>
  );
}
