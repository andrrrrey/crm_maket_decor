"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export function DashboardTaskWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await fetch("/api/manager/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), dueDate: dueDate || undefined }),
    });
    setLoading(false);
    setTitle("");
    setDueDate("");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Новая задача
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название задачи"
          className="flex-1 px-2 py-1.5 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Сохранение..." : "Добавить"}
      </button>
    </form>
  );
}
