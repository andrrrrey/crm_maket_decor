"use client";

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  format,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDayIndex(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
}

interface ProjectImage {
  id: string;
  filePath: string;
  imageType: string;
}

interface CalendarProject {
  id: string;
  number: number;
  date: string;
  venue?: string | null;
  description?: string | null;
  calendarColor: string;
  projectStatus: string;
  isCompleted: boolean;
  month: string;
  manager: { id: string; name: string };
  projectImages: ProjectImage[];
  contract?: { clientName: string } | null;
}

interface CalendarEntry {
  id: string;
  date: string;
  label: string;
  color: string;
  entryType: string;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
}

function projectLabel(p: CalendarProject): string {
  const parts = [p.contract?.clientName, p.venue].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : `Проект #${p.number}`;
}

export function MonthCalendar({ year, month, projects, calendarEntries }: MonthCalendarProps) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDayIndex(monthStart);

  // Build grid cells: padding + days
  const totalCells = startPadding + days.length;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {/* Leading empty cells */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] bg-muted/10 p-1" />
          ))}

          {days.map((day) => {
            const dayProjects = projects.filter((p) =>
              isSameDay(new Date(p.date), day)
            );
            const dayEntries = calendarEntries.filter((e) =>
              isSameDay(new Date(e.date), day)
            );
            const today = isToday(day);
            const isWeekend = getDayIndex(day) >= 5;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] p-1 flex flex-col gap-0.5",
                  today && "bg-primary/5",
                  isWeekend && !today && "bg-muted/5"
                )}
              >
                {/* Date number */}
                <div className="flex justify-end mb-0.5">
                  <span
                    className={cn(
                      "text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium",
                      today
                        ? "bg-primary text-primary-foreground font-bold"
                        : isWeekend
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Project chips */}
                {dayProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block rounded px-1.5 py-0.5 text-xs truncate font-medium transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: p.calendarColor,
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                    }}
                    title={projectLabel(p)}
                  >
                    {projectLabel(p)}
                  </Link>
                ))}

                {/* Calendar entry chips */}
                {dayEntries.map((e) => (
                  <div
                    key={e.id}
                    className="block rounded px-1.5 py-0.5 text-xs truncate"
                    style={{ backgroundColor: e.color + "33", color: e.color, border: `1px solid ${e.color}66` }}
                    title={e.label}
                  >
                    {e.label}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Trailing empty cells to complete last row */}
          {Array.from({ length: rows * 7 - totalCells }).map((_, i) => (
            <div key={`trail-${i}`} className="min-h-[100px] bg-muted/10 p-1" />
          ))}
        </div>
      </div>

      {/* Link to projects list */}
      <div className="flex justify-center">
        <Link
          href={`/projects?month=${format(monthStart, "yyyy-MM")}`}
          className="text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-md px-4 py-2 transition-colors hover:border-foreground"
        >
          Перейти в проекты месяца
        </Link>
      </div>
    </div>
  );
}
