import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { shouldFilterByManager } from "@/lib/permissions";
import { ClientStatusBadge } from "@/components/shared/StatusBadge";
import { FileList } from "@/components/files/FileList";
import { PROJECT_TYPE_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ClientActions } from "./ClientActions";

export default async function ClientPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      estimates: { orderBy: { version: "asc" } },
      contract: { select: { id: true, contractNumber: true } },
    },
  });

  if (!client) notFound();

  if (shouldFilterByManager(user.role) && client.managerId !== user.id) {
    notFound();
  }

  const canEdit = user.role === "DIRECTOR" || user.role === "MANAGER";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link
          href="/clients"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.clientName}</h1>
            <ClientStatusBadge status={client.status} />
            {client.isRejected && (
              <span className="text-xs text-muted-foreground">
                · #{client.number}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Менеджер: {client.manager.name}
          </p>
        </div>
        {canEdit && <ClientActions client={client} userId={user.id} />}
      </div>

      {/* Если переведён в договор */}
      {client.contract && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            Переведён в договор №{client.contract.contractNumber}
            {" "}
            <Link
              href={`/contracts/${client.contract.id}`}
              className="inline-flex items-center gap-1 font-medium underline"
            >
              Открыть договор <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        </div>
      )}

      {/* Причина отказа */}
      {client.isRejected && client.rejectionReason && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Причина отказа:
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {client.rejectionReason}
          </p>
        </div>
      )}

      {/* Основные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <h2 className="text-sm font-semibold">Информация о клиенте</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Тип проекта</dt>
              <dd>{PROJECT_TYPE_LABELS[client.projectType]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Источник</dt>
              <dd>{client.source ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Площадка</dt>
              <dd>{client.venue ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата обращения</dt>
              <dd>
                {format(new Date(client.dateReceived), "dd.MM.yyyy", {
                  locale: ru,
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата встречи</dt>
              <dd>{client.meetingDate ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата мероприятия</dt>
              <dd>
                {client.projectDate
                  ? format(new Date(client.projectDate), "dd.MM.yyyy", {
                      locale: ru,
                    })
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {client.projectIdea && (
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-2">Идея проекта</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {client.projectIdea}
            </p>
          </div>
        )}
      </div>

      {/* Файлы смет */}
      <div className="p-4 rounded-lg border bg-card">
        <h2 className="text-sm font-semibold mb-3">Сметы</h2>
        <FileList
          files={client.estimates.map((f) => ({
            ...f,
            uploadedAt: f.uploadedAt.toISOString(),
          }))}
          canDelete={canEdit}
        />
      </div>
    </div>
  );
}
