"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const optionalInt = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().positive().optional()
);

const optionalComplexity = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().min(1).max(5).optional()
);

const schema = z.object({
  startDate: z.string().min(1, "Обязательное поле"),
  installDate: z.string().optional(),
  daysToComplete: optionalInt,
  complexity: optionalComplexity,
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewMockupPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: todayISO(),
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== "") {
        payload[key] = value;
      }
    }
    // month вычисляется из startDate (формат YYYY-MM)
    payload.month = data.startDate.slice(0, 7);

    try {
      const res = await fetch("/api/designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/designer");
        return;
      }

      const errJson = await res.json().catch(() => null);
      if (res.status === 401) {
        setSubmitError("Сессия истекла. Войдите снова.");
      } else if (res.status === 403) {
        setSubmitError("Недостаточно прав для создания макета.");
      } else if (errJson?.error) {
        setSubmitError(
          typeof errJson.error === "string"
            ? errJson.error
            : "Проверьте корректность заполненных полей."
        );
      } else {
        setSubmitError(`Ошибка сервера (${res.status}).`);
      }
    } catch (e) {
      setSubmitError("Сетевая ошибка. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/designer"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Новый макет</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Сроки</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата начала *</label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата монтажа</label>
              <input
                type="date"
                {...register("installDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дней на выполнение</label>
              <input
                type="number"
                min="1"
                {...register("daysToComplete")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="7"
              />
              {errors.daysToComplete && (
                <p className="text-xs text-destructive">{errors.daysToComplete.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Сложность (1–5)</label>
              <input
                type="number"
                min="1"
                max="5"
                {...register("complexity")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="3"
              />
              {errors.complexity && (
                <p className="text-xs text-destructive">{errors.complexity.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Заметки</label>
          <textarea
            {...register("notes")}
            rows={4}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            placeholder="Требования, пожелания клиента..."
          />
        </div>

        {submitError && (
          <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Создать макет
          </button>
          <Link
            href="/designer"
            className="px-6 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
