"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";

export function TaskToggle({
  taskId,
  isCompleted,
}: {
  taskId: string;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    await fetch("/api/manager/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, isCompleted: !isCompleted }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading} className="shrink-0 mt-0.5 hover:opacity-70 transition-opacity">
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

export function TaskDeleteButton({ taskId }: { taskId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить задачу?")) return;
    await fetch(`/api/manager/tasks?id=${taskId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 shrink-0">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function ExpenseDeleteButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Удалить расход?")) return;
    await fetch(`/api/manager/expenses?id=${expenseId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 shrink-0">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function AddTaskForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/manager/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate: dueDate || undefined }),
    });
    setTitle("");
    setDueDate("");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
        <Plus className="h-3 w-3" /> Добавить задачу
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2 p-2 border rounded-md">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название задачи"
        className="w-full text-sm border rounded px-2 py-1 bg-background"
        autoFocus
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full text-sm border rounded px-2 py-1 bg-background"
      />
      <div className="flex gap-2">
        <button type="submit" className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded">
          Создать
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground">
          Отмена
        </button>
      </div>
    </form>
  );
}

export function AddExpenseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"general" | "consumables" | "project">("general");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    await fetch("/api/manager/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: parseFloat(amount), category }),
    });
    setDescription("");
    setAmount("");
    setCategory("general");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
        <Plus className="h-3 w-3" /> Добавить расход
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2 p-2 border rounded-md">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание"
        className="w-full text-sm border rounded px-2 py-1 bg-background"
        autoFocus
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Сумма"
        step="0.01"
        className="w-full text-sm border rounded px-2 py-1 bg-background"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as any)}
        className="w-full text-sm border rounded px-2 py-1 bg-background"
      >
        <option value="general">Общие</option>
        <option value="consumables">Расходники</option>
        <option value="project">Проект</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded">
          Создать
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground">
          Отмена
        </button>
      </div>
    </form>
  );
}
