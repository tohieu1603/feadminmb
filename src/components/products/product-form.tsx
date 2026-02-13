"use client";

import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Divider,
  Card,
  Row,
  Col,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import type { Product } from "@/types";
import { useProductCategories } from "@/hooks/use-products";

const { TextArea } = Input;

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export function ProductForm({ product, onSubmit, loading }: ProductFormProps) {
  const [form] = Form.useForm();
  const { data: categories } = useProductCategories();
  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        sku: product.sku,
        description: product.description,
        token_bonus: product.tokenBonus,
        tags: product.tags,
        specs: product.specs?.map((s) => ({ value: s.value, sort_order: s.sortOrder })) || [],
        full_specs:
          product.fullSpecs?.map((s) => ({
            group_name: s.groupName,
            label: s.label,
            value: s.value,
            sort_order: s.sortOrder,
          })) || [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ brand: "Operis", stock: 0 });
    }
  }, [product, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Form form={form} layout="vertical">
      {/* Thông tin cơ bản */}
      <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: "Nhập tên" }]}>
              <Input placeholder="Tên sản phẩm" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="slug" label="Slug" tooltip="Tự sinh từ tên nếu để trống">
              <Input placeholder="ao-thun-operis" disabled={isEdit} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="price" label="Giá (VND)" rules={[{ required: true, message: "Nhập giá" }]}>
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="stock" label="Tồn kho">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="token_bonus" label="Token Bonus">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="category" label="Danh mục">
              <Select placeholder="Chọn danh mục" allowClear>
                {categories?.map((cat: string) => (
                  <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="brand" label="Thương hiệu">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="sku" label="SKU">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="image" label="Ảnh URL">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={4} placeholder="Mô tả sản phẩm" />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Nhập tag rồi Enter" />
        </Form.Item>
      </Card>

      {/* Quick Specs */}
      <Card title="Quick Specs" style={{ marginBottom: 16 }}>
        <Form.List name="specs">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Row key={key} gutter={8} style={{ marginBottom: 8 }} align="middle">
                  <Col flex="auto">
                    <Form.Item {...rest} name={[name, "value"]} rules={[{ required: true, message: "Nhập giá trị" }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="Giá trị spec" />
                    </Form.Item>
                  </Col>
                  <Col flex="100px">
                    <Form.Item {...rest} name={[name, "sort_order"]} style={{ marginBottom: 0 }}>
                      <InputNumber placeholder="Thứ tự" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "#ff4d4f" }} />
                  </Col>
                </Row>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                Thêm spec
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Full Specs */}
      <Card title="Chi tiết Specs" style={{ marginBottom: 16 }}>
        <Form.List name="full_specs">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Row key={key} gutter={8} style={{ marginBottom: 8 }} align="middle">
                  <Col xs={24} sm={5}>
                    <Form.Item {...rest} name={[name, "group_name"]} style={{ marginBottom: 0 }}>
                      <Input placeholder="Nhóm" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={7}>
                    <Form.Item {...rest} name={[name, "label"]} rules={[{ required: true, message: "Nhập label" }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="Label" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={7}>
                    <Form.Item {...rest} name={[name, "value"]} rules={[{ required: true, message: "Nhập giá trị" }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="Giá trị" />
                    </Form.Item>
                  </Col>
                  <Col flex="80px">
                    <Form.Item {...rest} name={[name, "sort_order"]} style={{ marginBottom: 0 }}>
                      <InputNumber placeholder="TT" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "#ff4d4f" }} />
                  </Col>
                </Row>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                Thêm chi tiết spec
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Submit */}
      <Card>
        <Space>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
          </Button>
        </Space>
      </Card>
    </Form>
  );
}
