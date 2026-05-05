"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";

export function ContractImageUpload({
  contractId,
  imageType,
}: {
  contractId: string;
  imageType: "hall" | "ceremony" | "production";
}) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("imageType", imageType);
      await fetch(`/api/contracts/${contractId}/images`, {
        method: "POST",
        body: form,
      });
    }
    router.refresh();
    setShowUpload(false);
  };

  return (
    <>
      <button
        onClick={() => setShowUpload(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Добавить
      </button>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить изображение</h3>
            <FileUpload
              onUpload={handleUpload}
              accept=".jpg,.jpeg,.png,.webp"
              label="Выберите изображение"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ContractImageDelete({
  contractId,
  imageId,
}: {
  contractId: string;
  imageId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить изображение?")) return;
    setLoading(true);
    const form = new FormData();
    form.append("deleteId", imageId);
    await fetch(`/api/contracts/${contractId}/images`, {
      method: "POST",
      body: form,
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="absolute top-1 right-1 p-1 bg-black/60 rounded-md text-white hover:bg-black/80 disabled:opacity-50 transition-colors"
      title="Удалить"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
