"use client";

import { useState } from "react";
import { Typography, Card } from "antd";
import type { Tag } from "@/types";
import { TagTable } from "@/components/tags/tag-table";
import { TagFormModal } from "@/components/tags/tag-form-modal";

const { Title } = Typography;

export default function TagsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleAdd = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingTag(null);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Tags
        </Title>
      </div>

      <Card>
        <TagTable onAdd={handleAdd} onEdit={handleEdit} />
      </Card>

      <TagFormModal open={modalOpen} tag={editingTag} onClose={handleClose} />
    </>
  );
}
