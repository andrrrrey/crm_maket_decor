"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Pencil, Trash2 } from "lucide-react";
import { STAFF_SECTION_LABELS } from "@/lib/constants";

const SECTIONS = ["CORE_TEAM", "FREELANCE_MALE", "FREELANCE_FEMALE", "DRIVERS"] as const;

const inputClass = "w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none";
const labelClass = "text-xs text-muted-foreground";

// ==================== STAFF ====================

export function AddStaffButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    section: "CORE_TEAM" as string,
    fullName: "",
    position: "",
    phone: "",
    hasVehicle: "",
    startDate: "",
    birthDate: "",
    address: "",
    passport: "",
    telegramLink: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.position.trim()) return;
    setLoading(true);
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: form.section,
        fullName: form.fullName.trim(),
        position: form.position.trim(),
        phone: form.phone || undefined,
        hasVehicle: form.hasVehicle || undefined,
        startDate: form.startDate || undefined,
        birthDate: form.birthDate || undefined,
        address: form.address || undefined,
        passport: form.passport || undefined,
        telegramLink: form.telegramLink || undefined,
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ section: "CORE_TEAM", fullName: "", position: "", phone: "", hasVehicle: "", startDate: "", birthDate: "", address: "", passport: "", telegramLink: "", notes: "" });
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Добавить сотрудника
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новый сотрудник</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Раздел</label>
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputClass}>
                  {SECTIONS.map((s) => <option key={s} value={s}>{STAFF_SECTION_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>ФИО *</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} autoFocus />
                </div>
                <div>
                  <label className={labelClass}>Должность *</label>
                  <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telegram</label>
                  <input value={form.telegramLink} onChange={(e) => setForm({ ...form, telegramLink: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Дата рождения</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Начало работы</label>
                  <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="01.01.2024" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Паспорт</label>
                  <input value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Авто</label>
                  <input value={form.hasVehicle} onChange={(e) => setForm({ ...form, hasVehicle: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Примечание</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={loading || !form.fullName.trim() || !form.position.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">Создать</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface StaffData {
  id: string;
  section: string;
  fullName: string;
  position: string;
  passport: string | null;
  birthDate: Date | null;
  startDate: string | null;
  address: string | null;
  phone: string | null;
  hasVehicle: string | null;
  telegramLink: string | null;
  notes: string | null;
}

export function EditStaffButton({ person }: { person: StaffData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: person.fullName,
    position: person.position,
    phone: person.phone ?? "",
    hasVehicle: person.hasVehicle ?? "",
    startDate: person.startDate ?? "",
    birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split("T")[0] : "",
    address: person.address ?? "",
    passport: person.passport ?? "",
    telegramLink: person.telegramLink ?? "",
    notes: person.notes ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: person.id,
        fullName: form.fullName,
        position: form.position,
        phone: form.phone || undefined,
        hasVehicle: form.hasVehicle || undefined,
        startDate: form.startDate || undefined,
        birthDate: form.birthDate || undefined,
        address: form.address || undefined,
        passport: form.passport || undefined,
        telegramLink: form.telegramLink || undefined,
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
          <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Редактировать сотрудника</h3>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>ФИО</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Должность</label>
                  <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telegram</label>
                  <input value={form.telegramLink} onChange={(e) => setForm({ ...form, telegramLink: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Дата рождения</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Начало работы</label>
                  <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Паспорт</label>
                  <input value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Авто</label>
                  <input value={form.hasVehicle} onChange={(e) => setForm({ ...form, hasVehicle: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Примечание</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={loading || !form.fullName.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                <Save className="h-3.5 w-3.5" />Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteStaffButton({ personId }: { personId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить сотрудника?")) return;
    setLoading(true);
    await fetch(`/api/staff?id=${personId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="p-1 rounded hover:bg-accent transition-colors text-destructive" title="Удалить">
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

// ==================== CONTRACTORS ====================

interface ContractorData {
  id: string;
  name: string | null;
  category: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  recordedBy: string | null;
}

export function AddContractorButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", companyName: "", address: "", phone: "", notes: "", recordedBy: "" });

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.category.trim()) return;
    setLoading(true);
    await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        category: form.category.trim(),
        companyName: form.companyName.trim(),
        address: form.address || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
        recordedBy: form.recordedBy || undefined,
      }),
    });
    setLoading(false);
    setShow(false);
    setForm({ name: "", category: "", companyName: "", address: "", phone: "", notes: "", recordedBy: "" });
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Добавить подрядчика
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Новый подрядчик</h3>
              <button onClick={() => setShow(false)} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Наименование</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} autoFocus />
                </div>
                <div>
                  <label className={labelClass}>Категория *</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="напр. Флористика" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Название компании *</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Кто записал</label>
                  <input value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Примечание</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
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

export function EditContractorButton({ contractor }: { contractor: ContractorData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: contractor.name ?? "",
    companyName: contractor.companyName,
    address: contractor.address ?? "",
    phone: contractor.phone ?? "",
    notes: contractor.notes ?? "",
    recordedBy: contractor.recordedBy ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contractor.id,
        name: form.name || undefined,
        companyName: form.companyName,
        address: form.address || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
        recordedBy: form.recordedBy || undefined,
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Наименование</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Название компании</label>
                  <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Кто записал</label>
                  <input value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Примечание</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
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

export function DeleteContractorButton({ contractorId }: { contractorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить подрядчика?")) return;
    setLoading(true);
    await fetch(`/api/contractors?id=${contractorId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="p-1 rounded hover:bg-accent transition-colors text-destructive" title="Удалить">
      <Trash2 className="h-3 w-3" />
    </button>
  );
}
