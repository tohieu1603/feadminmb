"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Space, Spin, Empty, Popconfirm } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductCategories,
} from "@/hooks/use-products";
import { ProductPreviewEditor } from "@/components/products/product-preview-editor";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: product, isLoading } = useProduct(slug);
  const { data: categories } = useProductCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSave = async (data: Record<string, unknown>) => {
    if (!product) return;
    await updateProduct.mutateAsync({ id: product.id, data });
  };

  const handleDelete = () => {
    if (!product) return;
    deleteProduct.mutate(product.id, {
      onSuccess: () => router.push("/admin/products"),
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Empty description="Không tìm thấy sản phẩm" />
        <Button
          type="link"
          onClick={() => router.push("/admin/products")}
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin/products")}
          style={{ padding: 0 }}
        >
          Quay lại danh sách
        </Button>
        <Space>
          <Popconfirm
            title="Xoá sản phẩm này?"
            onConfirm={handleDelete}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <ProductPreviewEditor
        product={product}
        onSave={handleSave}
        saving={updateProduct.isPending}
        categories={categories}
      />
    </div>
  );
}
