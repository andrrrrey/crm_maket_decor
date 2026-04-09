import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewAllHistory } from "@/lib/permissions";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ROLE_LABELS } from "@/lib/constants";
import { formatHistoryEntry } from "@/lib/historyFormatter";
import type { Role } from "@/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { entityType?: string; page?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const page = Math.max(parseInt(searchParams.page ?? "1"), 1);
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (!canViewAllHistory(user.role)) {
    where.userId = user.id;
  }
  if (searchParams.entityType) {
    where.entityType = searchParams.entityType;
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">История действий</h1>
          <p className="text-sm text-muted-foreground">{total} записей</p>
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {entries.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Нет записей</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="p-3 flex items-start gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{entry.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[entry.user.role as Role]}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1">
                  {formatHistoryEntry(entry.action, entry.entityType, entry.details)}
                </p>
              </div>
              <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                {format(new Date(entry.createdAt), "dd.MM.yyyy HH:mm", {
                  locale: ru,
                })}
              </time>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(
            (p) => (
              <a
                key={p}
                href={`/history?page=${p}`}
                className={`px-3 py-1 rounded-md transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {p}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
