export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YearHorizontalCalendar } from "@/components/calendar/HorizontalCalendar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const managerFilter =
    user.role === "MANAGER" ? { managerId: user.id } : {};

  const monthFilter: any = {};
  if (user.role === "PRODUCTION") {
    const settings = await prisma.userSettings.findFirst({
      where: { user: { role: "DIRECTOR" } },
    });
    const openMonths: string[] = (settings?.openMonths as string[]) ?? [];
    if (openMonths.length > 0) {
      monthFilter.month = { in: openMonths };
    } else {
      monthFilter.month = { in: [] };
    }
  }

  const [projects, calendarEntries] = await Promise.all([
    prisma.project.findMany({
      where: { date: { gte: startDate, lt: endDate }, ...managerFilter, ...monthFilter },
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
      },
      orderBy: { date: "asc" },
    }),
    prisma.calendarEntry.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      orderBy: { date: "asc" },
    }),
  ]);

  const prevYear = year - 1;
  const nextYear = year + 1;

  return (
    <div className="space-y-4">
      {/* Header with year navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{year}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?year=${prevYear}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/calendar?year=${now.getFullYear()}`}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors border"
          >
            Текущий год
          </Link>
          <Link
            href={`/calendar?year=${nextYear}`}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-400" />
          Бронь
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-pink-200 border border-pink-400" />
          Монтаж
        </div>
      </div>

      {/* Full year horizontal scroll calendar */}
      <YearHorizontalCalendar
        year={year}
        projects={projects.map((p) => ({
          ...p,
          date: p.date.toISOString(),
        }))}
        calendarEntries={calendarEntries.map((e) => ({
          ...e,
          date: e.date.toISOString(),
          projectId: e.projectId ?? null,
        }))}
        canDelete={user.role === "DIRECTOR"}
      />
    </div>
  );
}
