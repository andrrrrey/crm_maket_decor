import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const createEntrySchema = z.object({
  date: z.string(),
  label: z.string().min(1),
  color: z.string(),
  entryType: z.string(),
  projectId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Delete
  if (body.deleteId) {
    await prisma.calendarEntry.delete({ where: { id: body.deleteId } });
    return NextResponse.json({ message: "Deleted" });
  }

  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.calendarEntry.create({
    data: {
      date: new Date(parsed.data.date),
      label: parsed.data.label,
      color: parsed.data.color,
      entryType: parsed.data.entryType,
      projectId: parsed.data.projectId,
    },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
