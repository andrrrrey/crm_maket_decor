"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PROJECT_TYPE_LABELS } from "@/lib/constants";

const PROJECT_TYPES = ["WEDDING", "CORPORATE", "BIRTHDAY", "OTHER"] as const;

const schema = z.object({
  dateReceived: z.string().min(1, "Обязательное поле"),
  clientName: z.string().min(1, "Обязательное поле"),
  projectType: z.enum(PROJECT_TYPES).default("WEDDING"),
  meetingDate: z.string().optional(),
  projectDate: z.string().optional(),
  venue: z.string().optional(),
  source: z.string().optional(),
  projectIdea: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewClientPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateReceived: todayISO(),
      projectType: "WEDDING",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    // Удалить пустые строки, чтобы API не получал "" для опциональных полей
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== "") {
        payload[key] = value;
      }
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        window.location.href = `/clients/${json.data.id}`;
        return;
      }

      const errJson = await res.json().catch(() => null);
      if (res.status === 401) {
        setSubmitError("Сессия истекла. Войдите снова.");
      } else if (res.status === 403) {
        setSubmitError("Недостаточно прав для создания клиента.");
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
          href="/clients"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Новый клиент</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Основная информация</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Имя клиента *</label>
            <input
              {...register("clientName")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Введите имя клиента"
            />
            {errors.clientName && (
              <p className="text-xs text-destructive">{errors.clientName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата обращения *</label>
              <input
                type="date"
                {...register("dateReceived")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.dateReceived && (
                <p className="text-xs text-destructive">{errors.dateReceived.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Тип проекта</label>
              <select
                {...register("projectType")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROJECT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Источник</label>
            <input
              {...register("source")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Instagram, рекомендация, сайт..."
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Мероприятие</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата встречи</label>
              <input
                type="date"
                {...register("meetingDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата мероприятия</label>
              <input
                type="date"
                {...register("projectDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
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
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Идея проекта</label>
          <textarea
            {...register("projectIdea")}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            placeholder="Описание идеи, пожелания клиента..."
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
            Создать клиента
          </button>
          <Link
            href="/clients"
            className="px-6 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
