"use client";

import { useState } from "react";
import {
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

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
}

interface CalendarEntry {
  id: string;
  date: string;
  label: string;
  color: string;
  entryType: string;
}

interface HorizontalCalendarProps {
  year: number;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
}

function getProjectsForDate(projects: CalendarProject[], date: Date) {
  return projects.filter((p) => {
    const d = new Date(p.date);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  });
}

function getEntriesForDate(entries: CalendarEntry[], date: Date) {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  });
}

function projectStatusColor(status: string) {
  switch (status) {
    case "MONTAGE": return "#FB923C";
    case "DEMONTAGE": return "#60A5FA";
    case "RESERVATION": return "#34D399";
    default: return "#FB923C";
  }
}

function MiniCalendarMonth({
  monthStart,
  projects,
  calendarEntries,
}: {
  monthStart: Date;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
}) {
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDayIndex(monthStart);

  return (
    <div className="border rounded-lg overflow-hidden text-xs shrink-0">
      <div className="grid grid-cols-7 bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-1 py-1 text-center text-muted-foreground font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-9 border-r border-b bg-muted/10" />
        ))}
        {days.map((day) => {
          const dayProjects = getProjectsForDate(projects, day);
          const dayEntries = getEntriesForDate(calendarEntries, day);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "h-9 p-0.5 border-r border-b flex flex-col",
                today && "bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "text-xs w-5 h-5 flex items-center justify-center rounded-full mx-auto",
                  today ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                {dayProjects.map((p) => (
                  <div
                    key={p.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: projectStatusColor(p.projectStatus) }}
                    title={p.venue ?? `#${p.number}`}
                  />
                ))}
                {dayEntries.map((e) => (
                  <div
                    key={e.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: e.color }}
                    title={e.label}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthProjectsModal({
  month,
  monthLabel,
  projects,
  onClose,
}: {
  month: string;
  monthLabel: string;
  projects: CalendarProject[];
  onClose: () => void;
}) {
  const monthProjects = projects.filter((p) => p.month === month);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold capitalize">
            Проекты — {monthLabel}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {monthProjects.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">Нет проектов в этом месяце</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Дата</th>
                  <th className="px-4 py-2 text-left">Площадка</th>
                  <th className="px-4 py-2 text-left">Менеджер</th>
                  <th className="px-4 py-2 text-center">Рисунок зала</th>
                  <th className="px-4 py-2 text-center">Рисунок церемонии</th>
                  <th className="px-4 py-2 text-left">Описание</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthProjects.map((project) => {
                  const hallImg = project.projectImages.find(
                    (img) => img.imageType === "hall" || img.imageType === "order"
                  );
                  const ceremonyImg = project.projectImages.find(
                    (img) => img.imageType === "ceremony"
                  );

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/projects/${project.id}`} className="block hover:text-primary">
                          {format(new Date(project.date), "dd.MM.yyyy", { locale: ru })}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:text-primary block">
                          {project.venue ?? `Проект #${project.number}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.manager.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hallImg ? (
                          <img
                            src={`/api/files/${hallImg.filePath}`}
                            alt="Зал"
                            className="w-12 h-12 object-cover rounded border mx-auto"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ceremonyImg ? (
                          <img
                            src={`/api/files/${ceremonyImg.filePath}`}
                            alt="Церемония"
                            className="w-12 h-12 object-cover rounded border mx-auto"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        <Link href={`/projects/${project.id}`} className="block hover:text-foreground line-clamp-2">
                          {project.description ?? "—"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function HorizontalCalendar({
  year,
  projects,
  calendarEntries,
}: HorizontalCalendarProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0)),
    end: endOfYear(new Date(year, 0)),
  });

  const activeMonthStart = activeModal
    ? months.find(
        (m) =>
          format(m, "yyyy-MM") === activeModal
      )
    : null;

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {months.map((monthStart) => {
            const monthKey = format(monthStart, "yyyy-MM");
            const monthLabel = format(monthStart, "LLLL yyyy", { locale: ru });
            const monthProjects = projects.filter((p) => p.month === monthKey);

            return (
              <div key={monthKey} className="w-72 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{monthLabel}</h3>
                  {monthProjects.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {monthProjects.length} пр.
                    </span>
                  )}
                </div>

                <MiniCalendarMonth
                  monthStart={monthStart}
                  projects={monthProjects}
                  calendarEntries={calendarEntries.filter((e) => {
                    const d = new Date(e.date);
                    return (
                      d.getFullYear() === monthStart.getFullYear() &&
                      d.getMonth() === monthStart.getMonth()
                    );
                  })}
                />

                <button
                  onClick={() => setActiveModal(monthKey)}
                  className="w-full text-xs text-center py-1.5 border border-dashed rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  Перейти в проекты месяца
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeModal && activeMonthStart && (
        <MonthProjectsModal
          month={activeModal}
          monthLabel={format(activeMonthStart, "LLLL yyyy", { locale: ru })}
          projects={projects}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
