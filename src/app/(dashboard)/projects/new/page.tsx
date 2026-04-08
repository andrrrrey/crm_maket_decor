"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CALENDAR_COLORS } from "@/lib/constants";

const schema = z.object({
  date: z.string().min(1, "Обязательное поле"),
  venue: z.string().optional(),
  description: z.string().optional(),
  calendarColor: z.string().default("#FB923C"),
  contractId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      calendarColor: "#FB923C",
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

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        router.push(`/projects/${json.data.id}`);
        return;
      }

      const errJson = await res.json().catch(() => null);
      if (res.status === 401) {
        setSubmitError("Сессия истекла. Войдите снова.");
      } else if (res.status === 403) {
        setSubmitError("Недостаточно прав для создания проекта.");
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
          href="/projects"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Новый проект</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Основная информация</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата мероприятия *</label>
              <input
                type="date"
                {...register("date")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Цвет в календаре</label>
              <select
                {...register("calendarColor")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                {CALENDAR_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Площадка</label>
            <input
              {...register("venue")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Название и адрес площадки"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">ID договора</label>
            <input
              {...register("contractId")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="(необязательно)"
            />
            <p className="text-xs text-muted-foreground">
              Связать проект с договором можно позже из карточки договора.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Описание</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            placeholder="Дополнительная информация о проекте..."
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
            Создать проект
          </button>
          <Link
            href="/projects"
            className="px-6 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
