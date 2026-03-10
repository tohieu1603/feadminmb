"use client";

import { useState } from "react";
import { Typography, Card } from "antd";
import type { Category } from "@/types";
import { CategoryTreeTable } from "@/components/categories/category-tree-table";
import { CategoryFormModal } from "@/components/categories/category-form-modal";

const { Title } = Typography;

export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Danh mục
        </Title>
      </div>

      <Card>
        <CategoryTreeTable onAdd={handleAdd} onEdit={handleEdit} />
      </Card>

      <CategoryFormModal
        open={modalOpen}
        category={editingCategory}
        onClose={handleClose}
      />
    </>
  );
}
