import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await (prisma as any).fabricCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { fabrics: true } } },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "PRODUCTION") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.id) {
    const updated = await (prisma as any).fabricCategory.update({
      where: { id: body.id },
      data: { name: body.name },
    });
    return NextResponse.json({ data: updated });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const category = await (prisma as any).fabricCategory.create({
    data: { name: body.name.trim(), sortOrder: body.sortOrder ?? 0 },
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

  const count = await (prisma as any).fabric.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить: в категории есть ${count} тканей` },
      { status: 400 }
    );
  }

  await (prisma as any).fabricCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
