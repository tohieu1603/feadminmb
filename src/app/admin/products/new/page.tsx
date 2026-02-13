"use client";

import { useRouter } from "next/navigation";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useCreateProduct, useProductCategories } from "@/hooks/use-products";
import { ProductPreviewEditor } from "@/components/products/product-preview-editor";

const { Title } = Typography;

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categories } = useProductCategories();

  const handleSave = async (data: Record<string, unknown>) => {
    await createProduct.mutateAsync(data);
    router.push("/admin/products");
  };

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/admin/products")}
        style={{ padding: 0, marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      <Title level={3} style={{ marginBottom: 24 }}>
        Tạo sản phẩm mới
      </Title>

      <ProductPreviewEditor
        onSave={handleSave}
        saving={createProduct.isPending}
        categories={categories}
        saveLabel="Tạo sản phẩm"
      />
    </div>
  );
}
