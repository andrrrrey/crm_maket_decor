"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2, Save } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export function AddFlowerCategoryButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/flowers/categories", {
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
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
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

export function EditFlowerCategoryButton({ category }: { category: Category }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category.name);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/flowers/categories", {
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
        className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
        title="Переименовать категорию"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Переименовать категорию</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
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
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
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

export function DeleteFlowerCategoryButton({ category }: { category: Category }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить категорию «${category.name}»?`)) return;
    setLoading(true);
    const res = await fetch(`/api/flowers/categories?id=${category.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Ошибка удаления");
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground disabled:opacity-50"
      title="Удалить категорию"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

interface Flower {
  id: string;
  name: string;
  categoryId: string | null;
  color: string | null;
  material: string | null;
  height: number | null;
  yearBought: string | null;
  quantity: number;
  pricePerUnit: string | null;
  photoUrl: string | null;
  articleNumber: string | null;
}

export function AddFlowerButton({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    color: "",
    material: "",
    height: "",
    yearBought: "",
    quantity: "0",
    pricePerUnit: "",
    articleNumber: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.categoryId) fd.append("categoryId", form.categoryId);
    if (form.color) fd.append("color", form.color);
    if (form.material) fd.append("material", form.material);
    if (form.height) fd.append("height", form.height);
    if (form.yearBought) fd.append("yearBought", form.yearBought);
    fd.append("quantity", form.quantity || "0");
    if (form.pricePerUnit) fd.append("pricePerUnit", form.pricePerUnit);
    if (form.articleNumber) fd.append("articleNumber", form.articleNumber);
    if (photo) fd.append("photo", photo);
    await fetch("/api/flowers", { method: "POST", body: fd });
    setLoading(false);
    setShow(false);
    setForm({ categoryId: "", name: "", color: "", material: "", height: "", yearBought: "", quantity: "0", pricePerUnit: "", articleNumber: "" });
    setPhoto(null);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
      >
        <Plus className="h-3.5 w-3.5" />
        Добавить цветок
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новый цветок</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Название *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Категория</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none">
                  <option value="">— Без категории —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Цвет</label>
                <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Материал</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Высота (см)</label>
                <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Год покупки</label>
                <input type="text" placeholder="2024" value={form.yearBought} onChange={(e) => setForm({ ...form, yearBought: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Количество</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Цена за шт (₽)</label>
                <input type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Фото</label>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Артикул</label>
                <input value={form.articleNumber} onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
                  placeholder="Оставьте пустым для автогенерации"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function EditFlowerButton({ flower, categories }: { flower: Flower; categories: Category[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoryId: flower.categoryId ?? "",
    name: flower.name,
    color: flower.color ?? "",
    material: flower.material ?? "",
    height: flower.height?.toString() ?? "",
    yearBought: flower.yearBought ?? "",
    quantity: flower.quantity.toString(),
    pricePerUnit: flower.pricePerUnit ?? "",
    articleNumber: flower.articleNumber ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("id", flower.id);
    fd.append("name", form.name.trim());
    if (form.categoryId) fd.append("categoryId", form.categoryId);
    if (form.color) fd.append("color", form.color);
    if (form.material) fd.append("material", form.material);
    if (form.height) fd.append("height", form.height);
    if (form.yearBought) fd.append("yearBought", form.yearBought);
    fd.append("quantity", form.quantity || "0");
    if (form.pricePerUnit) fd.append("pricePerUnit", form.pricePerUnit);
    if (form.articleNumber) fd.append("articleNumber", form.articleNumber);
    if (photo) fd.append("photo", photo);
    await fetch("/api/flowers", { method: "POST", body: fd });
    setLoading(false);
    setShow(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground" title="Редактировать">
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Редактировать</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Название *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Категория</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none">
                  <option value="">— Без категории —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Цвет</label>
                <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Материал</label>
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Высота (см)</label>
                <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Год покупки</label>
                <input type="text" placeholder="2024" value={form.yearBought} onChange={(e) => setForm({ ...form, yearBought: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Количество</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Цена за шт (₽)</label>
                <input type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Новое фото</label>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Артикул</label>
                <input value={form.articleNumber} onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteFlowerButton({ flower }: { flower: Flower }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить «${flower.name}»?`)) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("deleteId", flower.id);
    await fetch("/api/flowers", { method: "POST", body: fd });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground disabled:opacity-50"
      title="Удалить"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
