"use client";

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  getDay,
  isToday,
  format,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FolderKanban } from "lucide-react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDayIndex(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
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
  contract?: { clientName: string } | null;
}

interface CalendarEntry {
  id: string;
  date: string;
  label: string;
  color: string;
  entryType: string;
  projectId?: string | null;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
  canDelete?: boolean;
}

function projectLabel(p: CalendarProject): string {
  const parts = [p.contract?.clientName, p.venue].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : `Проект #${p.number}`;
}

function getCellBgClass(entries: CalendarEntry[]): string {
  const contractEntry = entries.find(
    (e) => e.entryType === "contract_reservation" || e.entryType === "contract_montage"
  );
  if (!contractEntry) return "";
  if (contractEntry.entryType === "contract_reservation") return "bg-green-200 dark:bg-green-900/60";
  if (contractEntry.entryType === "contract_montage") return "bg-pink-200 dark:bg-pink-900/60";
  return "";
}

function SingleMonthCalendar({
  year,
  month,
  projects,
  calendarEntries,
  canDelete,
}: MonthCalendarProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteEntry = async (id: string) => {
    setDeletingId(id);
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteId: id }),
    });
    setDeletingId(null);
    router.refresh();
  };

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDayIndex(monthStart);
  const totalCells = startPadding + days.length;
  const rows = Math.ceil(totalCells / 7);
  const monthKey = format(monthStart, "yyyy-MM");

  return (
    <div className="shrink-0 w-[320px]">
      {/* Month header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <h3 className="text-sm font-semibold capitalize flex-1">
          {format(monthStart, "LLLL yyyy", { locale: ru })}
        </h3>
        <Link
          href={`/projects?month=${monthKey}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed rounded px-2 py-1 transition-colors hover:border-foreground whitespace-nowrap"
          title="Перейти в проекты месяца"
        >
          <FolderKanban className="h-3 w-3" />
          Проекты
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[70px] bg-muted/10 p-1" />
          ))}

          {days.map((day) => {
            const dayProjects = projects.filter((p) => isSameDay(new Date(p.date), day));
            const dayEntries = calendarEntries.filter((e) => isSameDay(new Date(e.date), day));
            const today = isToday(day);
            const isWeekend = getDayIndex(day) >= 5;
            const cellBgClass = getCellBgClass(dayEntries);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[70px] p-0.5 flex flex-col gap-0.5",
                  cellBgClass || (today ? "bg-primary/5" : isWeekend ? "bg-muted/5" : "")
                )}
              >
                <div className="flex justify-end mb-0.5">
                  <span
                    className={cn(
                      "text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium",
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
                    className="block rounded px-1 py-0.5 text-xs truncate font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: p.calendarColor, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                    title={projectLabel(p)}
                  >
                    {projectLabel(p)}
                  </Link>
                ))}

                {/* Calendar entry chips */}
                {dayEntries.map((e) => {
                  const isContractEntry = e.entryType === "contract_reservation" || e.entryType === "contract_montage";
                  if (isContractEntry && e.projectId) {
                    return (
                      <Link
                        key={e.id}
                        href={`/contracts/${e.projectId}`}
                        className="block rounded px-1 py-0.5 text-xs truncate font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: e.color, color: "#1a1a1a" }}
                        title={e.label}
                      >
                        {e.label}
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={e.id}
                      className="group flex items-center rounded px-1 py-0.5 text-xs gap-0.5"
                      style={{ backgroundColor: e.color + "33", color: e.color, border: `1px solid ${e.color}66` }}
                      title={e.label}
                    >
                      <span className="truncate flex-1">{e.label}</span>
                      {canDelete && (
                        <button
                          onClick={() => deleteEntry(e.id)}
                          disabled={deletingId === e.id}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 disabled:opacity-50"
                          title="Удалить"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {Array.from({ length: rows * 7 - totalCells }).map((_, i) => (
            <div key={`trail-${i}`} className="min-h-[70px] bg-muted/10 p-1" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface YearHorizontalCalendarProps {
  year: number;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
  canDelete?: boolean;
}

export function YearHorizontalCalendar({
  year,
  projects,
  calendarEntries,
  canDelete,
}: YearHorizontalCalendarProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0)),
    end: endOfYear(new Date(year, 0)),
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6" style={{ minWidth: "max-content" }}>
        {months.map((monthStart) => {
          const m = monthStart.getMonth() + 1;
          const monthProjects = projects.filter((p) => {
            const d = new Date(p.date);
            return d.getFullYear() === year && d.getMonth() + 1 === m;
          });
          const monthEntries = calendarEntries.filter((e) => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() + 1 === m;
          });

          return (
            <SingleMonthCalendar
              key={monthStart.toISOString()}
              year={year}
              month={m}
              projects={monthProjects}
              calendarEntries={monthEntries}
              canDelete={canDelete}
            />
          );
        })}
      </div>
    </div>
  );
}

// Legacy single-month export for backward compatibility
export function MonthCalendar({ year, month, projects, calendarEntries, canDelete }: MonthCalendarProps) {
  return (
    <SingleMonthCalendar
      year={year}
      month={month}
      projects={projects}
      calendarEntries={calendarEntries}
      canDelete={canDelete}
    />
  );
}
