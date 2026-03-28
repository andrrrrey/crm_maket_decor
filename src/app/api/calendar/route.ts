import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  // Проекты за год
  const projects = await prisma.project.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
    },
    select: {
      id: true,
      number: true,
      date: true,
      venue: true,
      calendarColor: true,
      month: true,
      isCompleted: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  // Записи календаря (дополнительные метки)
  const calendarEntries = await prisma.calendarEntry.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: { projects, calendarEntries } });
}
