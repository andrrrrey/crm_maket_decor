import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

const createItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
  quantity: z.number().default(0),
});

const updateItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().optional(),
  status: z.string().optional(),
  comment: z.string().optional(),
  damageQuantity: z.number().optional(),
  damageDescription: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const items = await prisma.inventoryItem.findMany({
    where: categoryId ? { categoryId } : {},
    include: {
      category: true,
      _count: { select: { damages: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();

  // Обновление существующего (добавить убыток или изменить количество)
  if (body.id) {
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    if (data.damageQuantity) {
      // Добавить запись об убытке
      const damage = await prisma.inventoryDamage.create({
        data: {
          itemId: data.id,
          quantity: data.damageQuantity,
          description: data.damageDescription,
        },
      });
      // Уменьшить количество
      await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          quantity: { decrement: data.damageQuantity },
        },
      });
      await logAction(user.id, Actions.INVENTORY_DAMAGE, "inventory", data.id, {
        quantity: data.damageQuantity,
        description: data.damageDescription,
      });
      return NextResponse.json({ data: damage });
    }

    const item = await prisma.inventoryItem.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
    });
    await logAction(user.id, Actions.INVENTORY_UPDATE, "inventory", data.id);
    return NextResponse.json({ data: item });
  }

  // Создание нового
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      color: parsed.data.color,
      quantity: parsed.data.quantity,
    },
  });
  await logAction(user.id, Actions.INVENTORY_CREATE, "inventory", item.id, { name: item.name });
  return NextResponse.json({ data: item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id } });
  await logAction(user.id, Actions.INVENTORY_DELETE, "inventory", id, { name: existing.name });

  return NextResponse.json({ message: "Deleted" });
}
