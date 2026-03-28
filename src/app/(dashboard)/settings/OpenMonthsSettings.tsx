"use client";

import { useState, useTransition } from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenMonthsSettingsProps {
  initialMonths: string[];
}

function generateMonths(count = 18): string[] {
  const months: string[] = [];
  const start = startOfMonth(new Date());
  for (let i = -3; i < count; i++) {
    months.push(format(addMonths(start, i), "yyyy-MM"));
  }
  return months;
}

export function OpenMonthsSettings({ initialMonths }: OpenMonthsSettingsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialMonths));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const months = generateMonths();

  const toggle = (month: string) => {
    const next = new Set(selected);
    if (next.has(month)) {
      next.delete(month);
    } else {
      next.add(month);
    }
    setSelected(next);
  };

  const save = () => {
    startTransition(async () => {
      await fetch("/api/settings/open-months", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openMonths: Array.from(selected) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {months.map((month) => {
          const isSelected = selected.has(month);
          return (
            <button
              key={month}
              onClick={() => toggle(month)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
              )}
            >
              {format(new Date(month + "-01"), "MMM yyyy", { locale: ru })}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <Check className="h-3 w-3" />
          ) : null}
          {saved ? "Сохранено" : "Сохранить"}
        </button>
        <span className="text-xs text-muted-foreground">
          {selected.size} месяц(ев) открыто
        </span>
      </div>
    </div>
  );
}
