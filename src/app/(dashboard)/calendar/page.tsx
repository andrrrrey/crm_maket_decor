export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MonthCalendar } from "@/components/calendar/HorizontalCalendar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  // Parse month param (YYYY-MM), default to current month
  let year: number;
  let month: number;
  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    [year, month] = searchParams.month.split("-").map(Number);
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const prevMonth = subMonths(startDate, 1);
  const nextMonth = addMonths(startDate, 1);

  const managerFilter =
    user.role === "MANAGER" ? { managerId: user.id } : {};

  const [projects, calendarEntries] = await Promise.all([
    prisma.project.findMany({
      where: { date: { gte: startDate, lt: endDate }, ...managerFilter },
      select: {
        id: true,
        number: true,
        date: true,
        venue: true,
        description: true,
        calendarColor: true,
        projectStatus: true,
        month: true,
        isCompleted: true,
        manager: { select: { id: true, name: true } },
        contract: { select: { clientName: true } },
        projectImages: {
          select: { id: true, filePath: true, imageType: true },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.calendarEntry.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      orderBy: { date: "asc" },
    }),
  ]);

  const monthLabel = format(startDate, "LLLL yyyy", { locale: ru });

  return (
    <div className="space-y-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold capitalize">{monthLabel}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${format(prevMonth, "yyyy-MM")}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/calendar?month=${format(new Date(), "yyyy-MM")}`}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors border"
          >
            Сегодня
          </Link>
          <Link
            href={`/calendar?month=${format(nextMonth, "yyyy-MM")}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          Монтаж
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          Демонтаж
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          Бронь
        </div>
      </div>

      {/* Full month calendar */}
      <MonthCalendar
        year={year}
        month={month}
        projects={projects.map((p) => ({
          ...p,
          date: p.date.toISOString(),
        }))}
        calendarEntries={calendarEntries.map((e) => ({
          ...e,
          date: e.date.toISOString(),
        }))}
      />
    </div>
  );
}
