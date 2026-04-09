"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Pencil } from "lucide-react";

export function AddFabricButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    material: "",
    color: "",
    width: "",
    cuts: "",
    totalLength: "",
    yearBought: "",
    supplier: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.material.trim() || !form.color.trim()) return;
    setLoading(true);
    await fetch("/api/inventory/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        material: form.material.trim(),
        color: form.color.trim(),
        width: form.width ? Number(form.width) : undefined,
        cuts: form.cuts || undefined,
        totalLength: form.totalLength ? Number(form.totalLength) : undefined,
        yearBought: form.yearBought || undefined,
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ material: "", color: "", width: "", cuts: "", totalLength: "", yearBought: "", supplier: "", notes: "" });
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Добавить ткань
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новая ткань</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Материал *</label>
                  <input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Цвет *</label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ширина (см)</label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Длина (м)</label>
                  <input
                    type="number"
                    value={form.totalLength}
                    onChange={(e) => setForm({ ...form, totalLength: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Отрезы</label>
                <input
                  value={form.cuts}
                  onChange={(e) => setForm({ ...form, cuts: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Поставщик</label>
                  <input
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Год покупки</label>
                  <input
                    value={form.yearBought}
                    onChange={(e) => setForm({ ...form, yearBought: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Примечания</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.material.trim() || !form.color.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface FabricData {
  id: string;
  material: string;
  color: string;
  width: number | null;
  cuts: string | null;
  totalLength: any;
  yearBought: string | null;
  supplier: string | null;
  notes: string | null;
}

export function EditFabricButton({ fabric }: { fabric: FabricData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    material: fabric.material,
    color: fabric.color,
    width: fabric.width?.toString() ?? "",
    cuts: fabric.cuts ?? "",
    totalLength: fabric.totalLength ? Number(fabric.totalLength).toString() : "",
    yearBought: fabric.yearBought ?? "",
    supplier: fabric.supplier ?? "",
    notes: fabric.notes ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/inventory/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: fabric.id,
        material: form.material,
        color: form.color,
        width: form.width ? Number(form.width) : undefined,
        cuts: form.cuts || undefined,
        totalLength: form.totalLength ? Number(form.totalLength) : undefined,
        yearBought: form.yearBought || undefined,
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="p-1 rounded hover:bg-accent transition-colors"
        title="Редактировать"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Редактировать ткань</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Материал</label>
                  <input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Цвет</label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ширина (см)</label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Длина (м)</label>
                  <input
                    type="number"
                    value={form.totalLength}
                    onChange={(e) => setForm({ ...form, totalLength: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Отрезы</label>
                <input
                  value={form.cuts}
                  onChange={(e) => setForm({ ...form, cuts: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Поставщик</label>
                  <input
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Год покупки</label>
                  <input
                    value={form.yearBought}
                    onChange={(e) => setForm({ ...form, yearBought: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Примечания</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.material.trim() || !form.color.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Save className="h-3.5 w-3.5" />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
