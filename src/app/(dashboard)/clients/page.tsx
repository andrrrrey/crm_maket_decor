import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByManager } from "@/lib/permissions";
import { ClientsTable } from "@/components/tables/ClientsTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ClientWithManager } from "@/types";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { rejected?: string; managerId?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const showRejected = searchParams.rejected === "true";
  const where: any = { isRejected: showRejected };

  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  } else if (searchParams.managerId) {
    where.managerId = searchParams.managerId;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { estimates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const managers =
    user.role === "DIRECTOR"
      ? await prisma.user.findMany({
          where: { role: "MANAGER", isActive: true },
          select: { id: true, name: true },
        })
      : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            {showRejected ? "Отказы" : "Активные клиенты"}
          </p>
        </div>
        {(user.role === "DIRECTOR" || user.role === "MANAGER") && (
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый клиент
          </Link>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/clients"
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            !showRejected
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Активные
        </Link>
        <Link
          href="/clients?rejected=true"
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            showRejected
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Отказы
        </Link>

        {user.role === "DIRECTOR" && managers.length > 0 && (
          <div className="ml-4">
            <select
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
              defaultValue={searchParams.managerId ?? ""}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set("managerId", e.target.value);
                } else {
                  url.searchParams.delete("managerId");
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">Все менеджеры</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <ClientsTable data={clients as ClientWithManager[]} />
    </div>
  );
}
