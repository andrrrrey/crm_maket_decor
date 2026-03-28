import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMockupSchema = z.object({
  month: z.string(),
  startDate: z.string(),
  installDate: z.string().optional(),
  daysToComplete: z.number().optional(),
  complexity: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where: any = {};

  // Дизайнер видит только свои макеты
  if (user.role === "DESIGNER") {
    where.designerId = user.id;
  }

  if (month) {
    where.month = month;
  }

  const mockups = await prisma.mockup.findMany({
    where,
    include: {
      designer: { select: { id: true, name: true } },
      images: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: mockups });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "DESIGNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createMockupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const mockup = await prisma.mockup.create({
    data: {
      month: data.month,
      startDate: new Date(data.startDate),
      installDate: data.installDate ? new Date(data.installDate) : undefined,
      daysToComplete: data.daysToComplete,
      complexity: data.complexity,
      notes: data.notes,
      designerId: user.id,
    },
  });

  return NextResponse.json({ data: mockup }, { status: 201 });
}
