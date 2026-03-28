"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Обязательное поле"),
  clientName: z.string().optional(),
  eventDate: z.string().min(1, "Обязательное поле"),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewMockupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/designer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/designer");
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
          <h2 className="text-sm font-semibold">Информация о макете</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Название *</label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Название макета"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
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

          <div className="space-y-1">
            <label className="text-sm font-medium">Дедлайн</label>
            <input
              type="date"
              {...register("deadline")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Описание</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            placeholder="Требования, пожелания клиента..."
          />
        </div>

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
