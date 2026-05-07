import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

function generateArticleNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const createSchema = z.object({
  material: z.string().min(1),
  color: z.string().min(1),
  categoryId: z.string().optional(),
  photoUrl: z.string().optional(),
  width: z.number().optional(),
  cuts: z.string().optional(),
  quantity: z.number().optional(),
  totalLength: z.number().optional(),
  yearBought: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const fabrics = await (prisma as any).fabric.findMany({
    where: categoryId ? { categoryId } : {},
    orderBy: [{ material: "asc" }, { color: "asc" }],
  });

  return NextResponse.json({ data: fabrics });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER" && user.role !== "PRODUCTION") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.id) {
    const fabric = await (prisma as any).fabric.update({
      where: { id: body.id },
      data: {
        ...(body.material && { material: body.material }),
        ...(body.color && { color: body.color }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.width !== undefined && { width: body.width }),
        ...(body.cuts !== undefined && { cuts: body.cuts }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.totalLength !== undefined && { totalLength: body.totalLength }),
        ...(body.yearBought !== undefined && { yearBought: body.yearBought }),
        ...(body.supplier !== undefined && { supplier: body.supplier }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    await logAction(user.id, Actions.FABRIC_UPDATE, "fabric", body.id);
    return NextResponse.json({ data: fabric });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fabric = await (prisma as any).fabric.create({ data: { ...parsed.data, articleNumber: generateArticleNumber() } });
  await logAction(user.id, Actions.FABRIC_CREATE, "fabric", fabric.id, {
    material: fabric.material,
    color: fabric.color,
  });

  return NextResponse.json({ data: fabric }, { status: 201 });
}
