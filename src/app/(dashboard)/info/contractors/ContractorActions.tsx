"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Pencil, Trash2 } from "lucide-react";

export function AddContractorButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: "",
    companyName: "",
    address: "",
    phone: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.category.trim()) return;
    setLoading(true);
    await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category.trim(),
        companyName: form.companyName.trim(),
        address: form.address || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ category: "", companyName: "", address: "", phone: "", notes: "" });
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Добавить
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новый подрядчик</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Категория *</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="напр. Флористика" className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" autoFocus />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Название *</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Телефон</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Примечания</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={loading || !form.companyName.trim() || !form.category.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">Создать</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteContractorButton({ contractorId }: { contractorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить подрядчика? Это действие необратимо.")) return;
    setLoading(true);
    await fetch(`/api/contractors?id=${contractorId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1 rounded hover:bg-accent transition-colors text-destructive"
      title="Удалить"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

interface ContractorData {
  id: string;
  category: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
}

export function EditContractorButton({ contractor }: { contractor: ContractorData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: contractor.companyName,
    address: contractor.address ?? "",
    phone: contractor.phone ?? "",
    notes: contractor.notes ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contractor.id,
        companyName: form.companyName,
        address: form.address || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-accent transition-colors" title="Редактировать">
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Редактировать подрядчика</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Название</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Телефон</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Примечания</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={loading || !form.companyName.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                <Save className="h-3.5 w-3.5" />Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
