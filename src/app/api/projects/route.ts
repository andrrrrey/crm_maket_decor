import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager, shouldFilterByOpenMonths } from "@/lib/permissions";
import { z } from "zod";
import { format } from "date-fns";

const createProjectSchema = z.object({
  date: z.string(),
  venue: z.string().optional(),
  description: z.string().optional(),
  calendarColor: z.string().default("#FB923C"),
  contractId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-04"

  const where: any = {};

  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  }

  if (month) {
    where.month = month;
  }

  // Для производства — фильтр по открытым месяцам
  if (shouldFilterByOpenMonths(user.role)) {
    const settings = await prisma.userSettings.findFirst({
      where: { user: { role: "DIRECTOR" } },
    });
    const openMonths: string[] = (settings?.openMonths as string[]) ?? [];
    where.month = { in: openMonths };
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true, projectMessages: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const date = new Date(data.date);
  const month = format(date, "yyyy-MM");

  const project = await prisma.project.create({
    data: {
      date,
      venue: data.venue,
      description: data.description,
      calendarColor: data.calendarColor,
      month,
      managerId: user.id,
      contractId: data.contractId,
    },
  });

  await logAction(user.id, Actions.PROJECT_CREATE, "project", project.id, {
    venue: project.venue,
    date: project.date,
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
