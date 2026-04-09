"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CALENDAR_COLORS } from "@/lib/constants";

const ENTRY_TYPES = [
  { value: "install", label: "Монтаж" },
  { value: "uninstall", label: "Демонтаж" },
  { value: "booking", label: "Бронь" },
  { value: "other", label: "Другое" },
];

export function AddCalendarEntryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(CALENDAR_COLORS[0].value);
  const [entryType, setEntryType] = useState("install");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !label.trim()) return;
    setLoading(true);
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, label, color, entryType }),
    });
    setDate("");
    setLabel("");
    setColor(CALENDAR_COLORS[0].value);
    setEntryType("install");
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Добавить запись
      </button>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card space-y-3">
      <h3 className="text-sm font-semibold">Новая запись в календарь</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm border rounded px-2 py-1.5 bg-background"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Тип</label>
            <select
              value={entryType}
              onChange={(e) => {
                setEntryType(e.target.value);
                const typeIndex = ENTRY_TYPES.findIndex((t) => t.value === e.target.value);
                if (typeIndex < CALENDAR_COLORS.length) {
                  setColor(CALENDAR_COLORS[typeIndex].value);
                }
              }}
              className="w-full text-sm border rounded px-2 py-1.5 bg-background"
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Название</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Описание записи"
            className="w-full text-sm border rounded px-2 py-1.5 bg-background"
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Цвет</label>
          <div className="flex gap-2 mt-1">
            {CALENDAR_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c.value,
                  borderColor: color === c.value ? "#000" : "transparent",
                  transform: color === c.value ? "scale(1.2)" : "scale(1)",
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Создать
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:underline"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export function DeleteCalendarEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить запись из календаря?")) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteId: entryId }),
    });
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-destructive hover:text-destructive/80 transition-colors"
      title="Удалить"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
