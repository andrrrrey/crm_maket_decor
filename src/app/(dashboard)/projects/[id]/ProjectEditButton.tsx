"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { format } from "date-fns";
import { CALENDAR_COLORS, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface ManagerOption {
  id: string;
  name: string;
  role: Role;
}

interface ContractOption {
  id: string;
  contractNumber: number;
  clientName: string;
}

interface ProjectEditButtonProps {
  project: {
    id: string;
    venue: string | null;
    date: Date;
    description: string | null;
    calendarColor: string;
    isCompleted: boolean;
    managerId: string;
    contractId: string | null;
  };
  managers: ManagerOption[];
  availableContracts: ContractOption[];
  currentUserRole: Role;
}

export function ProjectDeleteButton({
  projectId,
  managerId,
  userId,
  userRole,
}: {
  projectId: string;
  managerId: string;
  userId: string;
  userRole: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const canDelete =
    userRole === "DIRECTOR" ||
    (userRole === "MANAGER" && managerId === userId);

  if (!canDelete) return null;

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setLoading(false);
    setShowDialog(false);
    window.location.href = "/projects";
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors text-destructive"
        title="Удалить проект"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Удалить
      </button>
      <ConfirmDialog
        open={showDialog}
        title="Удалить проект?"
        description="Это действие необратимо. Проект, все задачи и изображения будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDialog(false)}
        loading={loading}
      />
    </>
  );
}

export function ProjectEditButton({
  project,
  managers,
  availableContracts,
  currentUserRole,
}: ProjectEditButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    venue: project.venue ?? "",
    date: format(new Date(project.date), "yyyy-MM-dd"),
    description: project.description ?? "",
    calendarColor: project.calendarColor,
    managerId: project.managerId,
    contractId: project.contractId ?? "",
    isCompleted: project.isCompleted,
  });

  const canEditManager = currentUserRole === "DIRECTOR";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        venue: form.venue,
        date: new Date(form.date).toISOString(),
        description: form.description,
        calendarColor: form.calendarColor,
        isCompleted: form.isCompleted,
        contractId: form.contractId || null,
      };
      if (canEditManager) {
        payload.managerId = form.managerId;
      }

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Не удалось сохранить изменения"
        );
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Редактировать
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-lg border shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Редактирование проекта</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Название</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                  placeholder="Кафе, Свадьба Ивановых…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Дата</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Цвет в календаре</label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm({ ...form, calendarColor: c.value })}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        form.calendarColor === c.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {canEditManager && (
                <div>
                  <label className="block text-xs font-medium mb-1">Менеджер</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({ROLE_LABELS[m.role]})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Договор</label>
                <select
                  value={form.contractId}
                  onChange={(e) => setForm({ ...form, contractId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="">— Без договора —</option>
                  {availableContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      №{c.contractNumber} — {c.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCompleted"
                  checked={form.isCompleted}
                  onChange={(e) => setForm({ ...form, isCompleted: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="isCompleted" className="text-sm">
                  Проект завершён
                </label>
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
