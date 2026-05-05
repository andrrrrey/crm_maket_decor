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

  if (body.id) {
    const updated = await prisma.inventoryCategory.update({
      where: { id: body.id },
      data: { name: body.name },
    });
    return NextResponse.json({ data: updated });
  }

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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const category = await prisma.inventoryCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { items: true, children: true } },
    },
  });

  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (category._count.items > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить категорию: в ней есть ${category._count.items} позиций. Сначала удалите или переместите их.` },
      { status: 400 }
    );
  }

  if (category._count.children > 0) {
    return NextResponse.json(
      { error: "Нельзя удалить категорию: в ней есть подкатегории. Сначала удалите их." },
      { status: 400 }
    );
  }

  await prisma.inventoryCategory.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
