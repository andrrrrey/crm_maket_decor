"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, X, Save, Upload, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";

const STATUS_LABELS: Record<string, string> = {
  drawing: "В работе",
  pending_approval: "На согласовании",
  approved: "Согласован",
  transferred: "Передан",
  closed: "Закрыт",
};

const STATUS_COLORS: Record<string, string> = {
  drawing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  transferred: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const ZONES = [
  { key: "ceremony", label: "Церемония" },
  { key: "presidium", label: "Президиум" },
  { key: "banquet", label: "Банкетный зал" },
  { key: "photozone", label: "Фотозона" },
  { key: "entrance", label: "Вход" },
  { key: "other", label: "Другое" },
];

interface MockupData {
  id: string;
  status: string;
  startDate: string;
  installDate: string | null;
  daysToComplete: number | null;
  complexity: number | null;
  notes: string | null;
}

export function MockupStatusSelect({ mockup }: { mockup: MockupData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === mockup.status) return;
    setLoading(true);
    await fetch(`/api/designer/${mockup.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative inline-flex">
      <select
        value={mockup.status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border cursor-pointer focus:ring-1 focus:ring-ring outline-none disabled:opacity-60 bg-background transition-colors"
      >
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
    </div>
  );
}

export function MockupEditForm({ mockup }: { mockup: MockupData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    startDate: mockup.startDate.split("T")[0],
    installDate: mockup.installDate?.split("T")[0] ?? "",
    daysToComplete: mockup.daysToComplete?.toString() ?? "",
    complexity: mockup.complexity?.toString() ?? "",
    notes: mockup.notes ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/designer/${mockup.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: form.startDate,
        installDate: form.installDate || undefined,
        daysToComplete: form.daysToComplete ? Number(form.daysToComplete) : undefined,
        complexity: form.complexity ? Number(form.complexity) : undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="p-2 rounded-md hover:bg-accent transition-colors"
        title="Редактировать"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Редактировать макет</h3>
          <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Дата начала</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Дата монтажа</label>
              <input
                type="date"
                value={form.installDate}
                onChange={(e) => setForm({ ...form, installDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Дней на выполнение</label>
              <input
                type="number"
                value={form.daysToComplete}
                onChange={(e) => setForm({ ...form, daysToComplete: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Сложность (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Примечания</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export function MockupImageUpload({ mockupId }: { mockupId: string }) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [zone, setZone] = useState("ceremony");

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("zone", zone);
      await fetch(`/api/designer/${mockupId}/images`, {
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
        Загрузить изображение
      </button>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить изображение макета</h3>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground">Зона</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                {ZONES.map((z) => (
                  <option key={z.key} value={z.key}>
                    {z.label}
                  </option>
                ))}
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

export function MockupImageDelete({
  mockupId,
  imageId,
}: {
  mockupId: string;
  imageId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить изображение?")) return;
    setLoading(true);
    await fetch(`/api/designer/${mockupId}/images?imageId=${imageId}`, {
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

export { STATUS_LABELS, STATUS_COLORS, ZONES };
