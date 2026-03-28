"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Обязательное поле"),
  projectType: z.enum(["WEDDING", "CORPORATE", "BIRTHDAY", "OTHER"]).default("OTHER"),
  clientName: z.string().optional(),
  eventDate: z.string().min(1, "Обязательное поле"),
  venue: z.string().optional(),
  description: z.string().optional(),
  colorMark: z.string().optional(),
  mountDate: z.string().optional(),
  mountTime: z.string().optional(),
  unmountDate: z.string().optional(),
  unmountTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PROJECT_TYPES = [
  { value: "WEDDING", label: "Свадьба" },
  { value: "CORPORATE", label: "Корпоратив" },
  { value: "BIRTHDAY", label: "День рождения" },
  { value: "OTHER", label: "Другое" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const payload: Record<string, unknown> = { ...data };
    if (data.mountDate) {
      payload.mountDateTime = data.mountTime
        ? new Date(`${data.mountDate}T${data.mountTime}`).toISOString()
        : new Date(`${data.mountDate}T09:00`).toISOString();
    }
    if (data.unmountDate) {
      payload.unmountDateTime = data.unmountTime
        ? new Date(`${data.unmountDate}T${data.unmountTime}`).toISOString()
        : new Date(`${data.unmountDate}T21:00`).toISOString();
    }
    delete payload.mountDate;
    delete payload.mountTime;
    delete payload.unmountDate;
    delete payload.unmountTime;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      router.push(`/projects/${json.data.id}`);
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

          <div className="space-y-1">
            <label className="text-sm font-medium">Название *</label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Название проекта"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Тип проекта</label>
              <select
                {...register("projectType")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата мероприятия *</label>
              <input
                type="date"
                {...register("eventDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.eventDate && (
                <p className="text-xs text-destructive">{errors.eventDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Клиент</label>
              <input
                {...register("clientName")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="Имя клиента"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Площадка</label>
              <input
                {...register("venue")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="Название площадки"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Цветовая метка</label>
            <input
              type="color"
              {...register("colorMark")}
              defaultValue="#6366f1"
              className="h-9 w-20 px-1 py-1 border rounded-md bg-background cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Монтаж / Демонтаж</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата монтажа</label>
              <input
                type="date"
                {...register("mountDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Время монтажа</label>
              <input
                type="time"
                {...register("mountTime")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата демонтажа</label>
              <input
                type="date"
                {...register("unmountDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Время демонтажа</label>
              <input
                type="time"
                {...register("unmountTime")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Описание</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            placeholder="Дополнительная информация..."
          />
        </div>

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
