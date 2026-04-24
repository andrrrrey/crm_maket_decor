"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export function AddCategoryButton({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/inventory/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        parentId: parentId || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setName("");
    setParentId("");
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
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Название</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Родительская категория</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="">— Корневая —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                Отмена
              </button>
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

async function uploadPhoto(file: File): Promise<string | undefined> {
  const form = new FormData();
  form.append("file", file);
  form.append("dir", "inventory");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) return undefined;
  const json = await res.json();
  return json.data?.filePath;
}

export function AddItemButton({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    color: "",
    quantity: "0",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const flatCats: { id: string; name: string }[] = [];
  for (const c of categories) {
    flatCats.push({ id: c.id, name: c.name });
    if (c.children) {
      for (const ch of c.children) {
        flatCats.push({ id: ch.id, name: `${c.name} / ${ch.name}` });
      }
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) return;
    setLoading(true);
    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadPhoto(photoFile);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId,
        name: form.name.trim(),
        color: form.color || undefined,
        quantity: Number(form.quantity) || 0,
        photoUrl,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ categoryId: "", name: "", color: "", quantity: "0" });
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
        Позиция
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новая позиция</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Категория</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="">Выберите...</option>
                  {flatCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Название</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Цвет</label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Количество</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
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
                {photoFile && (
                  <p className="text-xs text-muted-foreground mt-1">{photoFile.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim() || !form.categoryId}
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

export function EditItemButton({ item }: { item: { id: string; name: string; color: string | null; quantity: number; status?: string; comment?: string | null; photoUrl?: string | null } }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    color: item.color ?? "",
    quantity: item.quantity.toString(),
    status: item.status ?? "active",
    comment: item.comment ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSave = async () => {
    setLoading(true);
    let photoUrl: string | undefined;
    if (photoFile) photoUrl = await uploadPhoto(photoFile);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        name: form.name,
        color: form.color || undefined,
        quantity: Number(form.quantity),
        status: form.status,
        comment: form.comment || undefined,
        ...(photoUrl !== undefined && { photoUrl }),
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
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Редактировать позицию</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Название</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Цвет</label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Количество</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="active">Активен</option>
                  <option value="in_use">В использовании</option>
                  <option value="damaged">Повреждён</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Комментарий</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Фото</label>
                {item.photoUrl && !photoFile && (
                  <img src={`/api/files/${item.photoUrl}`} alt="фото" className="w-16 h-16 object-cover rounded-md border mb-1 mt-1" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:text-xs file:bg-background file:hover:bg-accent file:cursor-pointer"
                />
                {photoFile && (
                  <p className="text-xs text-muted-foreground mt-1">{photoFile.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim()}
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

export function DamageButton({ item }: { item: { id: string; name: string } }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ quantity: "1", description: "" });

  const handleSave = async () => {
    if (!form.quantity || Number(form.quantity) <= 0) return;
    setLoading(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        damageQuantity: Number(form.quantity),
        damageDescription: form.description || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ quantity: "1", description: "" });
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="p-1 rounded hover:bg-accent transition-colors"
        title="Фиксировать повреждение"
      >
        <AlertTriangle className="h-3 w-3 text-orange-500" />
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Повреждение: {item.name}</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Количество</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Описание повреждения</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                disabled={loading || Number(form.quantity) <= 0}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                Зафиксировать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteItemButton({ item }: { item: { id: string; name: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить «${item.name}»? Это действие необратимо.`)) return;
    setLoading(true);
    await fetch(`/api/inventory?id=${item.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 rounded hover:bg-accent transition-colors text-destructive"
      title="Удалить позицию"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

export function InventorySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/inventory?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/inventory");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по инвентарю..."
        className="pl-9 pr-3 py-1.5 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none w-64"
      />
    </form>
  );
}
