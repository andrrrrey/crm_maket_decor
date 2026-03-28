"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const schema = z.object({
  number: z.string().min(1, "Обязательное поле"),
  clientName: z.string().min(1, "Обязательное поле"),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email("Неверный email").optional().or(z.literal("")),
  eventDate: z.string().optional(),
  eventType: z.string().optional(),
  venue: z.string().optional(),
  totalAmount: z.coerce.number().positive("Введите сумму").optional(),
  prepayment: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewContractPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      router.push(`/contracts/${json.data.id}`);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/contracts"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Новый договор</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Договор</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Номер договора *</label>
            <input
              {...register("number")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="2024-001"
            />
            {errors.number && (
              <p className="text-xs text-destructive">{errors.number.message}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Клиент</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Имя *</label>
            <input
              {...register("clientName")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Имя клиента"
            />
            {errors.clientName && (
              <p className="text-xs text-destructive">{errors.clientName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Телефон</label>
              <input
                {...register("clientPhone")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="+7 (999) 000-00-00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                {...register("clientEmail")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="client@example.com"
              />
              {errors.clientEmail && (
                <p className="text-xs text-destructive">{errors.clientEmail.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Мероприятие</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата</label>
              <input
                type="date"
                {...register("eventDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Тип</label>
              <input
                {...register("eventType")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="Свадьба, Корпоратив..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Площадка</label>
            <input
              {...register("venue")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Название и адрес"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Финансы</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Сумма (₽)</label>
              <input
                type="number"
                {...register("totalAmount")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="150000"
              />
              {errors.totalAmount && (
                <p className="text-xs text-destructive">{errors.totalAmount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Предоплата (₽)</label>
              <input
                type="number"
                {...register("prepayment")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="50000"
              />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-2">
          <label className="text-sm font-semibold">Примечания</label>
          <textarea
            {...register("notes")}
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
            Создать договор
          </button>
          <Link
            href="/contracts"
            className="px-6 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
