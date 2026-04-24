export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HorizontalCalendar } from "@/components/calendar/HorizontalCalendar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const currentYear = new Date().getFullYear();
  const year = parseInt(searchParams.year ?? String(currentYear));

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const session = await auth();
  const user = session?.user as any;

  const [projects, calendarEntries] = await Promise.all([
    prisma.project.findMany({
      where: { date: { gte: startDate, lt: endDate } },
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

  return (
    <div className="space-y-4">
      {/* Заголовок с навигацией по годам */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь {year}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?year=${year - 1}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium px-2">{year}</span>
          <Link
            href={`/calendar?year=${year + 1}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Легенда */}
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

      {/* Горизонтальный скролл по месяцам */}
      <HorizontalCalendar
        year={year}
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
