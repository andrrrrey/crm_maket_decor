"use client";

import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarCell } from "./CalendarCell";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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
  date: string;
  label: string;
  color: string;
  entryType: string;
  projectId?: string | null;
}

interface YearCalendarProps {
  year: number;
  projects: CalendarProject[];
  calendarEntries: CalendarEntry[];
}

function getProjectsForDate(
  projects: CalendarProject[],
  date: Date
): CalendarProject[] {
  return projects.filter((p) => {
    const d = new Date(p.date);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  });
}

function getEntriesForDate(
  entries: CalendarEntry[],
  date: Date
): CalendarEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  });
}

// Понедельник = 0, Воскресенье = 6
function getDayIndex(date: Date): number {
  const day = getDay(date); // 0=Вс, 1=Пн..6=Сб
  return day === 0 ? 6 : day - 1;
}

export function YearCalendar({
  year,
  projects,
  calendarEntries,
}: YearCalendarProps) {
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0)),
    end: endOfYear(new Date(year, 0)),
  });

  return (
    <div className="space-y-8">
      {months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Определить смещение (сколько пустых ячеек в начале)
        const startPadding = getDayIndex(monthStart);

        return (
          <div key={monthStart.toISOString()}>
            <h3 className="text-sm font-semibold mb-2 capitalize">
              {format(monthStart, "LLLL yyyy", { locale: ru })}
            </h3>
            <div className="border rounded-lg overflow-hidden">
              {/* Заголовок дней недели */}
              <div className="grid grid-cols-7 bg-muted/50">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-1 text-xs font-medium text-muted-foreground text-center border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Сетка дней */}
              <div className="grid grid-cols-7">
                {/* Пустые ячейки */}
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[80px] border-r border-b bg-muted/10"
                  />
                ))}

                {/* Дни месяца */}
                {days.map((day) => (
                  <CalendarCell
                    key={day.toISOString()}
                    date={day}
                    projects={getProjectsForDate(projects, day)}
                    entries={getEntriesForDate(calendarEntries, day)}
                    isToday={isToday(day)}
                    isCurrentMonth={isSameMonth(day, monthStart)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
