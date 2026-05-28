"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

interface OpenMonthsSettingsProps {
  initialMonths: string[];
}

function getYearRange(): number[] {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1, current + 2];
}

export function OpenMonthsSettings({ initialMonths }: OpenMonthsSettingsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialMonths));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = getYearRange();

  const toggleMonth = (year: number, monthIdx: number) => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
  };

  const removeMonth = (key: string) => {
    const next = new Set(selected);
    next.delete(key);
    setSelected(next);
  };

  const save = () => {
    startTransition(async () => {
      await fetch("/api/settings/open-months", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: Array.from(selected) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const addNext12Months = () => {
    const next = new Set(selected);
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      next.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    setSelected(next);
  };

  // Group selected months by year for display
  const selectedByYear: Record<string, string[]> = {};
  for (const key of Array.from(selected).sort()) {
    const [y, m] = key.split("-");
    if (!selectedByYear[y]) selectedByYear[y] = [];
    selectedByYear[y].push(m);
  }

  return (
    <div className="space-y-4">
      {/* Year + month picker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">Выберите месяцы:</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {MONTH_SHORT.map((label, idx) => {
            const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
            const isActive = selected.has(key);
            return (
              <button
                key={idx}
                onClick={() => toggleMonth(selectedYear, idx)}
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs font-medium border transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected months chips grouped by year */}
      {Object.keys(selectedByYear).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(selectedByYear).sort().map(([year, months]) => (
            <div key={year} className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">{year}:</span>
              {months.map((m) => {
                const key = `${year}-${m}`;
                const monthLabel = MONTH_SHORT[parseInt(m, 10) - 1];
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                  >
                    {monthLabel}
                    <button
                      onClick={() => removeMonth(key)}
                      className="hover:text-destructive ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
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
        <button
          onClick={addNext12Months}
          className="flex items-center gap-1.5 px-4 py-1.5 border rounded-md text-xs font-medium hover:bg-accent transition-colors"
        >
          +12 месяцев
        </button>
        <span className="text-xs text-muted-foreground">
          {selected.size} мес. открыто
        </span>
      </div>
    </div>
  );
}
