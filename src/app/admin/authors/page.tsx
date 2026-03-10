"use client";

import { useState } from "react";
import { Typography, Card } from "antd";
import type { Author } from "@/types";
import { AuthorTable } from "@/components/authors/author-table";
import { AuthorFormModal } from "@/components/authors/author-form-modal";

const { Title } = Typography;

export default function AuthorsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

  const handleAdd = () => {
    setEditingAuthor(null);
    setModalOpen(true);
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingAuthor(null);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Tác giả
        </Title>
      </div>

      <Card>
        <AuthorTable onAdd={handleAdd} onEdit={handleEdit} />
      </Card>

      <AuthorFormModal open={modalOpen} author={editingAuthor} onClose={handleClose} />
    </>
  );
}
