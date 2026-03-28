import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/stats/StatsCards";

async function getStats(userId: string, role: string, year: number) {
  const managerFilter = role === "MANAGER" ? { managerId: userId } : {};

  const [totalClients, totalContracts, totalProjects, rejectedClients, clientsByStatus] =
    await Promise.all([
      prisma.client.count({ where: { ...managerFilter, isRejected: false } }),
      prisma.contract.count({ where: managerFilter }),
      prisma.project.count({ where: managerFilter }),
      prisma.client.count({ where: { ...managerFilter, isRejected: true } }),
      prisma.client.groupBy({
        by: ["status"],
        where: managerFilter,
        _count: true,
      }),
    ]);

  const conversionRate =
    totalClients + rejectedClients + totalContracts > 0
      ? Math.round(
          (totalContracts /
            (totalClients + rejectedClients + totalContracts)) *
            100
        )
      : 0;

  return {
    totalClients,
    totalContracts,
    totalProjects,
    rejectedClients,
    conversionRate,
    clientsByStatus: clientsByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const year = parseInt(searchParams.year ?? String(new Date().getFullYear()));

  const stats = await getStats(user.id, user.role, year);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Статистика {year}</h1>
      </div>

      <StatsCards
        totalClients={stats.totalClients}
        totalContracts={stats.totalContracts}
        totalProjects={stats.totalProjects}
        conversionRate={stats.conversionRate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Воронка */}
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-4">Воронка продаж</h2>
          <div className="space-y-2">
            {stats.clientsByStatus
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${
                            stats.totalClients > 0
                              ? (item.count / stats.totalClients) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-mono w-6 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Отказы */}
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-4">Общая аналитика</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Активных клиентов</dt>
              <dd className="font-medium">{stats.totalClients}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Отказов</dt>
              <dd className="font-medium text-destructive">{stats.rejectedClients}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Договоров</dt>
              <dd className="font-medium">{stats.totalContracts}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Проектов</dt>
              <dd className="font-medium">{stats.totalProjects}</dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-muted-foreground">Конверсия</dt>
              <dd className="font-bold text-green-600">{stats.conversionRate}%</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
