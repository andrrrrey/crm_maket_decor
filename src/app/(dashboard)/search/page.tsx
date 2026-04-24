export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByManager } from "@/lib/permissions";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const q = searchParams.q?.trim();

  if (!q || q.length < 2) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Поиск</h1>
        <p className="text-sm text-muted-foreground">
          Введите минимум 2 символа для поиска
        </p>
      </div>
    );
  }

  const managerFilter = shouldFilterByManager(user.role)
    ? { managerId: user.id }
    : {};

  const [clients, contracts, projects] = await Promise.all([
    prisma.client.findMany({
      where: {
        ...managerFilter,
        isRejected: false,
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { venue: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, clientName: true, status: true, venue: true },
      take: 10,
    }),
    prisma.contract.findMany({
      where: {
        ...managerFilter,
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { venue: { contains: q, mode: "insensitive" } },
          { invoiceNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, clientName: true, contractNumber: true, venue: true },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        ...managerFilter,
        OR: [
          { venue: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, venue: true, number: true },
      take: 10,
    }),
  ]);

  const total = clients.length + contracts.length + projects.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Поиск</h1>
        <p className="text-sm text-muted-foreground">
          Результаты для &laquo;{q}&raquo;: {total} найдено
        </p>
      </div>

      {total === 0 && (
        <p className="text-muted-foreground">Ничего не найдено</p>
      )}

      {clients.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Клиенты ({clients.length})
          </h2>
          <div className="border rounded-lg divide-y">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="block px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium">{c.clientName}</div>
                {c.venue && (
                  <div className="text-xs text-muted-foreground">{c.venue}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Договоры ({contracts.length})
          </h2>
          <div className="border rounded-lg divide-y">
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="block px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium">
                  Договор №{c.contractNumber} — {c.clientName}
                </div>
                {c.venue && (
                  <div className="text-xs text-muted-foreground">{c.venue}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Проекты ({projects.length})
          </h2>
          <div className="border rounded-lg divide-y">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium">
                  {p.venue ?? `Проект #${p.number}`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
