import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractsTable } from "@/components/tables/ContractsTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ContractWithManager } from "@/types";

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export default async function ContractsPage() {
  const session = await auth();
  const user = session?.user as any;
  const isDirector = user.role === "DIRECTOR";

  const contracts = await prisma.contract.findMany({
    include: {
      manager: { select: { id: true, name: true } },
      sourceClient: { select: { id: true, clientName: true } },
    },
    orderBy: { installDate: "asc" },
  });

  // Get yearPlans from director settings
  const directorSettings = await prisma.userSettings.findFirst({
    where: { user: { role: "DIRECTOR" } },
  });
  const yearPlans = (directorSettings?.yearPlans as Record<string, number>) ?? {};

  // Build per-manager stats (always all managers for director)
  const managerMap: Record<string, { name: string; total: number; prepayment: number }> = {};
  for (const c of contracts) {
    const mid = c.managerId;
    if (!managerMap[mid]) {
      managerMap[mid] = { name: c.manager.name, total: 0, prepayment: 0 };
    }
    managerMap[mid].total += Number(c.totalAmount ?? 0);
    managerMap[mid].prepayment += Number(c.prepaymentAmount ?? 0);
  }

  // For manager: only their own stats
  const statsEntries = isDirector
    ? Object.entries(managerMap)
    : Object.entries(managerMap).filter(([id]) => id === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Договоры</h1>
          <p className="text-sm text-muted-foreground">
            {contracts.length} договоров
          </p>
        </div>
        {(user.role === "DIRECTOR" || user.role === "MANAGER") && (
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый договор
          </Link>
        )}
      </div>

      {/* Summary stats */}
      {statsEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {isDirector ? "Статистика по менеджерам" : "Моя статистика"}
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Менеджер</th>
                  <th className="px-4 py-2 text-right">План год</th>
                  <th className="px-4 py-2 text-right">Сейчас</th>
                  <th className="px-4 py-2 text-right">Еще осталось</th>
                  {isDirector && <th className="px-4 py-2 text-right">Предоплаты</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {statsEntries.map(([managerId, stats]) => {
                  const plan = yearPlans[managerId] ?? 0;
                  const remaining = plan > 0 ? plan - stats.total : null;
                  return (
                    <tr key={managerId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{stats.name}</td>
                      <td className="px-4 py-2.5 text-right">
                        {plan > 0 ? `${fmt(plan)} ₽` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {fmt(stats.total)} ₽
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {remaining !== null ? (
                          <span className={remaining < 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {remaining < 0 ? `+${fmt(-remaining)}` : `${fmt(remaining)}`} ₽
                          </span>
                        ) : "—"}
                      </td>
                      {isDirector && (
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {fmt(stats.prepayment)} ₽
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ContractsTable data={contracts as ContractWithManager[]} />
    </div>
  );
}
