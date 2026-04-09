"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";

export function ProjectImageUpload({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [imageType, setImageType] = useState<"order" | "production">("order");

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("imageType", imageType);
      await fetch(`/api/projects/${projectId}/images`, {
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
        Загрузить фото
      </button>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить фотографию</h3>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground">Тип</label>
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value as typeof imageType)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                <option value="order">Эскизы заказа</option>
                <option value="production">Фото производства</option>
              </select>
            </div>
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

export function ProjectImageDelete({
  projectId,
  imageId,
}: {
  projectId: string;
  imageId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить изображение?")) return;
    setLoading(true);
    await fetch(`/api/projects/${projectId}/images?imageId=${imageId}`, {
      method: "DELETE",
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
