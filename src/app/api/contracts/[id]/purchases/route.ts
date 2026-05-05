import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purchases = await prisma.contractPurchase.findMany({
    where: { contractId: params.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: purchases });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.deleteId) {
    await prisma.contractPurchase.delete({ where: { id: body.deleteId } });
    return NextResponse.json({ message: "Deleted" });
  }

  if (body.toggleId) {
    const purchase = await prisma.contractPurchase.findUnique({ where: { id: body.toggleId } });
    if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.contractPurchase.update({
      where: { id: body.toggleId },
      data: { isCompleted: !purchase.isCompleted },
    });
    return NextResponse.json({ data: updated });
  }

  const { title } = body;
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const maxOrder = await prisma.contractPurchase.aggregate({
    where: { contractId: params.id },
    _max: { sortOrder: true },
  });

  const purchase = await prisma.contractPurchase.create({
    data: {
      contractId: params.id,
      title: title.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ data: purchase }, { status: 201 });
}
