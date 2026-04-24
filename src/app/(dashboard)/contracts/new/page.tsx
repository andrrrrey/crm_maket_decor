"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().nonnegative("Сумма не может быть отрицательной").optional()
);

const schema = z.object({
  dateSignedAt: z.string().min(1, "Обязательное поле"),
  installDate: z.string().min(1, "Обязательное поле"),
  clientName: z.string().min(1, "Обязательное поле"),
  venue: z.string().optional(),
  totalAmount: optionalNumber,
  prepaymentDate: z.string().optional(),
  prepaymentAmount: optionalNumber,
  invoiceNumber: z.string().optional(),
  orgAmount: optionalNumber,
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

export default function NewContractPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateSignedAt: todayISO(),
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    // Удалить пустые/неопределённые поля, чтобы API получил только заполненные
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== "") {
        payload[key] = value;
      }
    }

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        window.location.href = `/contracts/${json.data.id}`;
        return;
      }

      const errJson = await res.json().catch(() => null);
      if (res.status === 401) {
        setSubmitError("Сессия истекла. Войдите снова.");
      } else if (res.status === 403) {
        setSubmitError("Недостаточно прав для создания договора.");
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата заключения *</label>
              <input
                type="date"
                {...register("dateSignedAt")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.dateSignedAt && (
                <p className="text-xs text-destructive">{errors.dateSignedAt.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата монтажа *</label>
              <input
                type="date"
                {...register("installDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
              {errors.installDate && (
                <p className="text-xs text-destructive">{errors.installDate.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card space-y-4">
          <h2 className="text-sm font-semibold">Клиент</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Имя клиента *</label>
            <input
              {...register("clientName")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="Имя клиента"
            />
            {errors.clientName && (
              <p className="text-xs text-destructive">{errors.clientName.message}</p>
            )}
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
              <label className="text-sm font-medium">Общая сумма (₽)</label>
              <input
                type="number"
                step="0.01"
                {...register("totalAmount")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="150000"
              />
              {errors.totalAmount && (
                <p className="text-xs text-destructive">{errors.totalAmount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Сумма организатору (₽)</label>
              <input
                type="number"
                step="0.01"
                {...register("orgAmount")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="0"
              />
              {errors.orgAmount && (
                <p className="text-xs text-destructive">{errors.orgAmount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Сумма предоплаты (₽)</label>
              <input
                type="number"
                step="0.01"
                {...register("prepaymentAmount")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                placeholder="50000"
              />
              {errors.prepaymentAmount && (
                <p className="text-xs text-destructive">{errors.prepaymentAmount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Дата предоплаты</label>
              <input
                type="date"
                {...register("prepaymentDate")}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Номер счёта</label>
            <input
              {...register("invoiceNumber")}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              placeholder="2024-001"
            />
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
