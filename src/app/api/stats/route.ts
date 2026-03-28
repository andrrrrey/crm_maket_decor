import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const managerId = user.role === "MANAGER" ? user.id : searchParams.get("managerId");
  const managerFilter = managerId ? { managerId } : {};

  // Клиенты по статусам (воронка)
  const clientsByStatus = await prisma.client.groupBy({
    by: ["status"],
    where: managerFilter,
    _count: true,
  });

  // Общая статистика
  const [totalClients, totalContracts, totalProjects, rejectedClients] =
    await Promise.all([
      prisma.client.count({ where: { ...managerFilter, isRejected: false } }),
      prisma.contract.count({ where: managerFilter }),
      prisma.project.count({ where: managerFilter }),
      prisma.client.count({ where: { ...managerFilter, isRejected: true } }),
    ]);

  // Доходы по месяцам за год
  const contracts = await prisma.contract.findMany({
    where: {
      ...managerFilter,
      installDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    select: { installDate: true, totalAmount: true },
  });

  const revenueByMonth: Record<string, number> = {};
  for (const c of contracts) {
    const month = `${c.installDate.getFullYear()}-${String(c.installDate.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + Number(c.totalAmount ?? 0);
  }

  const revenueArray = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const conversionRate =
    totalClients + rejectedClients > 0
      ? Math.round((totalContracts / (totalClients + rejectedClients + totalContracts)) * 100)
      : 0;

  return NextResponse.json({
    data: {
      totalClients,
      totalContracts,
      totalProjects,
      rejectedClients,
      conversionRate,
      clientsByStatus: clientsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      revenueByMonth: revenueArray,
    },
  });
}
