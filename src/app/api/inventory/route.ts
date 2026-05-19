import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

function generateArticleNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const createItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
  quantity: z.number().default(0),
  photoUrl: z.string().optional(),
  articleNumber: z.string().optional(),
});

const updateItemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().optional(),
  status: z.string().optional(),
  comment: z.string().optional(),
  photoUrl: z.string().optional(),
  location: z.string().optional(),
  articleNumber: z.string().optional(),
  damageQuantity: z.number().optional(),
  damageDescription: z.string().optional(),
  categoryId: z.string().optional(),
  setTotalDamages: z.number().min(0).optional(),
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

    // Установить абсолютное значение потерь
    if (data.setTotalDamages !== undefined) {
      const current = await prisma.inventoryItem.findUnique({
        where: { id: data.id },
        include: { damages: { select: { quantity: true } } },
      });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const currentTotalDamages = current.damages.reduce((s, d) => s + d.quantity, 0);
      const originalQuantity = current.quantity + currentTotalDamages;
      const newQuantity = Math.max(0, originalQuantity - data.setTotalDamages);

      await prisma.inventoryDamage.deleteMany({ where: { itemId: data.id } });
      if (data.setTotalDamages > 0) {
        await prisma.inventoryDamage.create({
          data: { itemId: data.id, quantity: data.setTotalDamages },
        });
      }

      const item = await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          quantity: newQuantity,
          ...(data.name && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
          ...(data.location !== undefined && { location: data.location } as any),
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.articleNumber !== undefined && { articleNumber: data.articleNumber } as any),
        },
      } as any);
      await logAction(user.id, Actions.INVENTORY_DAMAGE, "inventory", data.id, {
        quantity: data.setTotalDamages,
      });
      return NextResponse.json({ data: item });
    }

    if (data.damageQuantity) {
      // Добавить запись об убытке
      const damage = await prisma.inventoryDamage.create({
        data: {
          itemId: data.id,
          quantity: data.damageQuantity,
          description: data.damageDescription,
        },
      });
      // Уменьшить количество и обновить остальные поля
      await prisma.inventoryItem.update({
        where: { id: data.id },
        data: {
          quantity: { decrement: data.damageQuantity },
          ...(data.name && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
          ...(data.location !== undefined && { location: data.location } as any),
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.articleNumber !== undefined && { articleNumber: data.articleNumber } as any),
        },
      } as any);
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
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.location !== undefined && { location: data.location } as any),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.articleNumber !== undefined && { articleNumber: data.articleNumber } as any),
      },
    } as any);
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
      photoUrl: parsed.data.photoUrl,
      articleNumber: parsed.data.articleNumber || generateArticleNumber(),
    } as any,
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
