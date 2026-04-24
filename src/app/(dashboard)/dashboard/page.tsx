export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/stats/StatsCards";
import { ROLE_LABELS, CLIENT_STATUS_LABELS } from "@/lib/constants";
import type { Role } from "@/types";
import { DashboardTaskWidget } from "./DashboardTaskWidget";
import { DashboardProjectTasks, DashboardManagerTasks } from "./DashboardTasks";
import { ManagerFilter } from "@/components/filters/ManagerFilter";

async function getStats(userId: string, role: string) {
  const managerFilter = role === "MANAGER" ? { managerId: userId } : {};

  const [totalClients, totalContracts, totalProjects, rejectedClients, clientsByStatus] =
    await Promise.all([
      prisma.client.count({ where: { ...managerFilter, isRejected: false, status: { not: "CONTRACT" } } }),
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
          (totalContracts / (totalClients + rejectedClients + totalContracts)) * 100
        )
      : 0;

  return {
    totalClients,
    totalContracts,
    totalProjects,
    rejectedClients,
    conversionRate,
    clientsByStatus: clientsByStatus.map((s) => ({ status: s.status, count: s._count })),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { managerId?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const isDirector = user?.role === "DIRECTOR";
  const isManager = user?.role === "MANAGER";
  const showStats = isDirector || isManager;

  const filterManagerId = isDirector
    ? (searchParams.managerId || undefined)
    : user.id;

  const statsUserId = filterManagerId || user.id;
  const statsRole = (isDirector && !filterManagerId) ? "DIRECTOR" : "MANAGER";
  const stats = showStats ? await getStats(statsUserId, statsRole) : null;

  // Fetch all managers for director filter
  const managers = isDirector
    ? await prisma.user.findMany({
        where: { isActive: true, role: { in: ["DIRECTOR", "MANAGER"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Fetch project tasks (from projects)
  const projectTasksWhere: any = { isCompleted: false };
  if (filterManagerId) {
    projectTasksWhere.project = { managerId: filterManagerId };
  } else if (isManager) {
    projectTasksWhere.project = { managerId: user.id };
  }

  const projectTasks = (isDirector || isManager)
    ? await prisma.projectTask.findMany({
        where: projectTasksWhere,
        include: {
          project: {
            select: {
              id: true,
              venue: true,
              number: true,
              manager: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
        take: 50,
      })
    : [];

  // Fetch personal manager tasks
  const managerTasksWhere: any = { isCompleted: false };
  if (filterManagerId) {
    managerTasksWhere.userId = filterManagerId;
  } else if (isManager) {
    managerTasksWhere.userId = user.id;
  }

  const managerTasks = (isDirector || isManager)
    ? await prisma.managerTask.findMany({
        where: managerTasksWhere,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];

  // Expenses
  const expensesWhere: any = {};
  if (filterManagerId) {
    expensesWhere.userId = filterManagerId;
  } else if (isManager) {
    expensesWhere.userId = user.id;
  }

  const [generalExpenses, projectExpenses] = (isDirector || isManager)
    ? await Promise.all([
        prisma.expense.aggregate({
          where: { ...expensesWhere, projectId: null },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { ...expensesWhere, projectId: { not: null } },
          _sum: { amount: true },
        }),
      ])
    : [{ _sum: { amount: null } }, { _sum: { amount: null } }];

  const sortedStatuses = stats
    ? [...stats.clientsByStatus].sort((a, b) => b.count - a.count)
    : [];
  const maxStatusCount = sortedStatuses[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать, {user?.name}!</h1>
          <p className="text-sm text-muted-foreground">
            {ROLE_LABELS[user?.role as Role] ?? user?.role} · Maket Decor CRM
          </p>
        </div>
        {isDirector && managers.length > 0 && (
          <ManagerFilter managers={managers} currentManagerId={searchParams.managerId} />
        )}
      </div>

      {/* Статистика */}
      {showStats && stats && (
        <>
          <StatsCards
            totalClients={stats.totalClients}
            totalContracts={stats.totalContracts}
            totalProjects={stats.totalProjects}
            conversionRate={stats.conversionRate}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border bg-card">
              <h2 className="text-sm font-semibold mb-4">Воронка продаж</h2>
              <div className="space-y-2">
                {sortedStatuses.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {CLIENT_STATUS_LABELS[item.status as keyof typeof CLIENT_STATUS_LABELS] ?? item.status}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono w-6 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h2 className="text-sm font-semibold mb-4">Общая аналитика</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Активных клиентов</dt>
                  <dd className="font-medium">{stats.totalClients.toLocaleString("ru-RU")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Отказов</dt>
                  <dd className="font-medium text-destructive">{stats.rejectedClients.toLocaleString("ru-RU")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Договоров</dt>
                  <dd className="font-medium">{stats.totalContracts.toLocaleString("ru-RU")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Проектов</dt>
                  <dd className="font-medium">{stats.totalProjects.toLocaleString("ru-RU")}</dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-muted-foreground">Конверсия</dt>
                  <dd className="font-bold text-green-600">{stats.conversionRate}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}

      {/* Задачи и расходы */}
      {(isDirector || isManager) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Задачи из проектов */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-3">
              Задачи по проектам ({projectTasks.length})
            </h2>
            <DashboardProjectTasks tasks={projectTasks} isDirector={isDirector} />
          </div>

          {/* Личные задачи + создание */}
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-3">
              Личные задачи ({managerTasks.length})
            </h2>
            <div className="mb-3">
              <DashboardManagerTasks tasks={managerTasks} isDirector={isDirector} />
            </div>
            <DashboardTaskWidget />
          </div>
        </div>
      )}

      {/* Расходы */}
      {(isDirector || isManager) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-1">Расходы общие</h2>
            <p className="text-2xl font-bold">
              {Number(generalExpenses._sum.amount ?? 0).toLocaleString("ru-RU")} ₽
            </p>
            <p className="text-xs text-muted-foreground mt-1">Не привязанные к проектам</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-1">Расходы проектов</h2>
            <p className="text-2xl font-bold">
              {Number(projectExpenses._sum.amount ?? 0).toLocaleString("ru-RU")} ₽
            </p>
            <p className="text-xs text-muted-foreground mt-1">По конкретным проектам</p>
          </div>
        </div>
      )}
    </div>
  );
}
