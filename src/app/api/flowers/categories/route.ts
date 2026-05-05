import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.flowerCategory.findMany({
    include: { _count: { select: { flowers: true } } },
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
    const updated = await prisma.flowerCategory.update({
      where: { id: body.id },
      data: { name: body.name },
    });
    return NextResponse.json({ data: updated });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const maxOrder = await prisma.flowerCategory.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.flowerCategory.create({
    data: {
      name: body.name.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
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

  const cat = await prisma.flowerCategory.findUnique({
    where: { id },
    include: { _count: { select: { flowers: true } } },
  });

  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (cat._count.flowers > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить категорию: в ней есть ${cat._count.flowers} позиций.` },
      { status: 400 }
    );
  }

  await prisma.flowerCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
