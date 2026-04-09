"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

const ROLES: Role[] = ["DIRECTOR", "MANAGER", "PRODUCTION", "DESIGNER"];

export function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    login: "",
    password: "",
    name: "",
    role: "MANAGER" as Role,
    phone: "",
    hasInfoAccess: false,
  });

  const reset = () => {
    setForm({
      email: "",
      login: "",
      password: "",
      name: "",
      role: "MANAGER",
      phone: "",
      hasInfoAccess: false,
    });
    setError(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.login.length < 3) {
      setError("Логин должен содержать минимум 3 символа");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          login: form.login,
          password: form.password,
          name: form.name,
          role: form.role,
          phone: form.phone || undefined,
          hasInfoAccess: form.hasInfoAccess,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("Пользователь с таким email или логином уже существует");
        } else if (typeof data?.error === "string") {
          setError(data.error);
        } else {
          setError("Не удалось создать пользователя");
        }
        return;
      }

      close();
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Добавить
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-background rounded-lg border shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Новый пользователь</h3>
              <button
                onClick={close}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Имя</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Логин</label>
                <input
                  type="text"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  required
                  minLength={3}
                  maxLength={32}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Пароль</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Минимум 6 символов</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Роль</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-ring outline-none"
                />
              </div>

              {form.role === "MANAGER" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasInfoAccess"
                    checked={form.hasInfoAccess}
                    onChange={(e) => setForm({ ...form, hasInfoAccess: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="hasInfoAccess" className="text-sm">
                    Доступ к разделу «Инфо»
                  </label>
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
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
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
