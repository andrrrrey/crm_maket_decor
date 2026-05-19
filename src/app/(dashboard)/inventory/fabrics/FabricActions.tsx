"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Pencil, Trash2 } from "lucide-react";

interface FabricCategory {
  id: string;
  name: string;
}

async function uploadFabricPhoto(file: File): Promise<string | undefined> {
  const form = new FormData();
  form.append("file", file);
  form.append("dir", "inventory");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) return undefined;
  const json = await res.json();
  return json.data?.filePath;
}

export function AddFabricCategoryButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/inventory/fabric-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    setShow(false);
    setName("");
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Категория
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новая категория</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Название</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button
                onClick={handleSave}
                disabled={loading || !name.trim()}
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

export function EditFabricCategoryButton({ category }: { category: { id: string; name: string } }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category.name);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/inventory/fabric-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: category.id, name: name.trim() }),
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
        title="Переименовать"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Переименовать категорию</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Название</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button
                onClick={handleSave}
                disabled={loading || !name.trim()}
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

export function DeleteFabricCategoryButton({ category }: { category: { id: string; name: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить категорию «${category.name}»?`)) return;
    setLoading(true);
    const res = await fetch(`/api/inventory/fabric-categories?id=${category.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Ошибка при удалении");
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 rounded hover:bg-accent transition-colors text-destructive"
      title="Удалить категорию"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

export function AddFabricButton({ categories }: { categories: FabricCategory[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    material: "",
    color: "#cccccc",
    width: "",
    cuts: "",
    totalLength: "",
    yearBought: "",
    supplier: "",
    notes: "",
    articleNumber: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSave = async () => {
    if (!form.material.trim() || !form.color.trim()) return;
    setLoading(true);
    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadFabricPhoto(photoFile);
    await fetch("/api/inventory/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId || undefined,
        material: form.material.trim(),
        color: form.color.trim(),
        photoUrl,
        width: form.width ? Number(form.width) : undefined,
        cuts: form.cuts || undefined,
        totalLength: form.totalLength ? Number(form.totalLength) : undefined,
        yearBought: form.yearBought || undefined,
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
        articleNumber: form.articleNumber || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ categoryId: "", material: "", color: "#cccccc", width: "", cuts: "", totalLength: "", yearBought: "", supplier: "", notes: "", articleNumber: "" });
    setPhotoFile(null);
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
              {categories.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Категория</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  >
                    <option value="">— Без категории —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-9 w-12 rounded border cursor-pointer bg-background p-0.5"
                      title="Выбрать цвет"
                    />
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:text-xs file:bg-background file:hover:bg-accent file:cursor-pointer"
                />
                {photoFile && <p className="text-xs text-muted-foreground mt-1">{photoFile.name}</p>}
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
              <div>
                <label className="text-xs text-muted-foreground">Артикул</label>
                <input
                  value={form.articleNumber}
                  onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
                  placeholder="Оставьте пустым для автогенерации"
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
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
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
  categoryId: string | null;
  material: string;
  color: string;
  photoUrl: string | null;
  width: number | null;
  cuts: string | null;
  totalLength: any;
  yearBought: string | null;
  supplier: string | null;
  notes: string | null;
  articleNumber: string | null;
}

export function EditFabricButton({ fabric, categories }: { fabric: FabricData; categories: FabricCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoryId: fabric.categoryId ?? "",
    material: fabric.material,
    color: fabric.color,
    width: fabric.width?.toString() ?? "",
    cuts: fabric.cuts ?? "",
    totalLength: fabric.totalLength ? Number(fabric.totalLength).toString() : "",
    yearBought: fabric.yearBought ?? "",
    supplier: fabric.supplier ?? "",
    notes: fabric.notes ?? "",
    articleNumber: fabric.articleNumber ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSave = async () => {
    setLoading(true);
    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadFabricPhoto(photoFile);
    await fetch("/api/inventory/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: fabric.id,
        categoryId: form.categoryId || null,
        material: form.material,
        color: form.color,
        ...(photoUrl !== undefined && { photoUrl }),
        width: form.width ? Number(form.width) : undefined,
        cuts: form.cuts || undefined,
        totalLength: form.totalLength ? Number(form.totalLength) : undefined,
        yearBought: form.yearBought || undefined,
        supplier: form.supplier || undefined,
        notes: form.notes || undefined,
        articleNumber: form.articleNumber || undefined,
      }),
    });
    setLoading(false);
    setEditing(false);
    setPhotoFile(null);
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
              {categories.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Категория</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  >
                    <option value="">— Без категории —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={form.color.startsWith("#") ? form.color : "#cccccc"}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-9 w-12 rounded border cursor-pointer bg-background p-0.5"
                      title="Выбрать цвет"
                    />
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Фото</label>
                {fabric.photoUrl && !photoFile && (
                  <img src={`/api/files/${fabric.photoUrl}`} alt="фото" className="w-20 h-20 object-cover rounded-md border mb-1 mt-1" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:text-xs file:bg-background file:hover:bg-accent file:cursor-pointer"
                />
                {photoFile && <p className="text-xs text-muted-foreground mt-1">{photoFile.name}</p>}
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
              <div>
                <label className="text-xs text-muted-foreground">Артикул</label>
                <input
                  value={form.articleNumber}
                  onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
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
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
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
