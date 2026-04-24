"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function ProjectFabricNote({
  projectId,
  initialValue,
  canEdit,
}: {
  projectId: string;
  initialValue: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fabricNote: value }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!canEdit}
        placeholder="Тип ткани / материал..."
        rows={3}
        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none disabled:opacity-60"
      />
      {canEdit && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-3 w-3" />
          {saved ? "Сохранено" : loading ? "Сохранение..." : "Сохранить"}
        </button>
      )}
    </div>
  );
}
