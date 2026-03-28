"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CalendarProject {
  id: string;
  number: number;
  date: string;
  venue?: string | null;
  calendarColor: string;
  isCompleted: boolean;
}

interface CalendarEntry {
  id: string;
  label: string;
  color: string;
  entryType: string;
  projectId?: string | null;
}

interface CalendarCellProps {
  date: Date;
  projects: CalendarProject[];
  entries: CalendarEntry[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function CalendarCell({
  date,
  projects,
  entries,
  isToday,
  isCurrentMonth,
}: CalendarCellProps) {
  const dayNum = date.getDate();
  const allItems = [
    ...entries.map((e) => ({
      id: e.id,
      label: e.label,
      color: e.color,
      href: e.projectId ? `/projects/${e.projectId}` : undefined,
      isCompleted: false,
    })),
    ...projects.map((p) => ({
      id: p.id,
      label: p.venue ? `#${p.number} ${p.venue}` : `#${p.number}`,
      color: p.calendarColor,
      href: `/projects/${p.id}`,
      isCompleted: p.isCompleted,
    })),
  ];

  return (
    <div
      className={cn(
        "min-h-[80px] p-1 border-r border-b transition-colors",
        !isCurrentMonth && "bg-muted/20",
        isToday && "bg-primary/5"
      )}
    >
      <div
        className={cn(
          "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
          isToday
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        )}
      >
        {dayNum}
      </div>

      <div className="space-y-0.5">
        {allItems.map((item) => (
          item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "block text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity",
                item.isCompleted && "line-through opacity-60"
              )}
              style={{ backgroundColor: item.color, color: "#1a1a1a" }}
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <div
              key={item.id}
              className="text-xs px-1.5 py-0.5 rounded truncate"
              style={{ backgroundColor: item.color, color: "#1a1a1a" }}
              title={item.label}
            >
              {item.label}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
