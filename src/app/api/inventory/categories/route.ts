import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.inventoryCategory.findMany({
    include: {
      children: {
        include: {
          children: true,
          _count: { select: { items: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { items: true } },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.inventoryCategory.create({
    data: {
      name: parsed.data.name,
      parentId: parsed.data.parentId,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
