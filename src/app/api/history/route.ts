import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewAllHistory } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const skip = (page - 1) * limit;

  const where: any = {};

  // Не директор — видит только свои записи
  if (!canViewAllHistory(user.role)) {
    where.userId = user.id;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  const [entries, total] = await Promise.all([
    prisma.historyEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.historyEntry.count({ where }),
  ]);

  return NextResponse.json({
    data: entries,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
