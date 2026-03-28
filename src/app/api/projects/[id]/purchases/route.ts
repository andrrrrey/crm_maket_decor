import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Обновление существующей закупки
  if (body.purchaseId) {
    const purchase = await prisma.projectPurchase.update({
      where: { id: body.purchaseId },
      data: {
        ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
        ...(body.title && { title: body.title }),
      },
    });
    return NextResponse.json({ data: purchase });
  }

  // Создание новой закупки
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.projectPurchase.count({ where: { projectId: params.id } });
  const purchase = await prisma.projectPurchase.create({
    data: {
      projectId: params.id,
      title: parsed.data.title,
      sortOrder: count,
    },
  });

  return NextResponse.json({ data: purchase }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get("purchaseId");
  if (!purchaseId) return NextResponse.json({ error: "purchaseId required" }, { status: 400 });

  await prisma.projectPurchase.delete({ where: { id: purchaseId } });
  return NextResponse.json({ message: "Deleted" });
}
