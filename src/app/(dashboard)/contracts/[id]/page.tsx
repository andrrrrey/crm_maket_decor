import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { shouldFilterByManager } from "@/lib/permissions";
import { MockupStatusBadge } from "@/components/shared/StatusBadge";
import { FileListWithDelete } from "@/components/files/FileListWithDelete";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MockupStatusSelect, ContractEditForm, ContractFileUpload } from "./ContractEditForm";
import type { ContractMockupStatus } from "@/types";

export default async function ContractPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      sourceClient: { select: { id: true, clientName: true } },
      estimates: { orderBy: { version: "asc" } },
      contractFiles: { orderBy: { uploadedAt: "desc" } },
      mockupImages: { orderBy: { uploadedAt: "desc" } },
      project: { select: { id: true, number: true } },
    },
  });

  if (!contract) notFound();

  if (shouldFilterByManager(user.role) && contract.managerId !== user.id) {
    notFound();
  }

  const canEdit = user.role === "DIRECTOR" || user.role === "MANAGER";

  const contractFiles = contract.contractFiles.filter(
    (f) => f.fileType === "contract"
  );
  const invoiceFiles = contract.contractFiles.filter(
    (f) => f.fileType === "invoice"
  );
  const otherFiles = contract.contractFiles.filter(
    (f) => f.fileType === "other"
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link href="/contracts" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Договор №{contract.contractNumber}
            </h1>
            {canEdit ? (
              <MockupStatusSelect
                contract={{
                  id: contract.id,
                  mockupStatus: contract.mockupStatus as ContractMockupStatus,
                  clientName: contract.clientName,
                  venue: contract.venue,
                  totalAmount: contract.totalAmount?.toString() ?? null,
                  prepaymentDate: contract.prepaymentDate,
                  prepaymentAmount: contract.prepaymentAmount?.toString() ?? null,
                  invoiceNumber: contract.invoiceNumber,
                  orgAmount: contract.orgAmount?.toString() ?? null,
                  notes: contract.notes,
                  dateSignedAt: contract.dateSignedAt.toISOString(),
                  installDate: contract.installDate.toISOString(),
                }}
              />
            ) : (
              <MockupStatusBadge status={contract.mockupStatus} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {contract.clientName} · Менеджер: {contract.manager.name}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <ContractEditForm
              contract={{
                id: contract.id,
                mockupStatus: contract.mockupStatus as ContractMockupStatus,
                clientName: contract.clientName,
                venue: contract.venue,
                totalAmount: contract.totalAmount?.toString() ?? null,
                prepaymentDate: contract.prepaymentDate,
                prepaymentAmount: contract.prepaymentAmount?.toString() ?? null,
                invoiceNumber: contract.invoiceNumber,
                orgAmount: contract.orgAmount?.toString() ?? null,
                notes: contract.notes,
                dateSignedAt: contract.dateSignedAt.toISOString(),
                installDate: contract.installDate.toISOString(),
              }}
            />
          </div>
        )}
      </div>

      {/* Связи */}
      <div className="flex gap-4 flex-wrap">
        {contract.sourceClient && (
          <Link
            href={`/clients/${contract.sourceClient.id}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Клиент: {contract.sourceClient.clientName}
          </Link>
        )}
        {contract.project && (
          <Link
            href={`/projects/${contract.project.id}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Проект #{contract.project.number}
          </Link>
        )}
      </div>

      {/* Основные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <h2 className="text-sm font-semibold">Детали договора</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата заключения</dt>
              <dd>
                {format(new Date(contract.dateSignedAt), "dd.MM.yyyy", {
                  locale: ru,
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата монтажа</dt>
              <dd>
                {format(new Date(contract.installDate), "dd.MM.yyyy", {
                  locale: ru,
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Площадка</dt>
              <dd>{contract.venue ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Общая сумма</dt>
              <dd>
                {contract.totalAmount
                  ? `${Number(contract.totalAmount).toLocaleString("ru-RU")} ₽`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Предоплата</dt>
              <dd>
                {contract.prepaymentAmount
                  ? `${Number(contract.prepaymentAmount).toLocaleString("ru-RU")} ₽`
                  : "—"}
                {contract.prepaymentDate && ` (${contract.prepaymentDate})`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">№ счёта</dt>
              <dd>{contract.invoiceNumber ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Сумма орг</dt>
              <dd>
                {contract.orgAmount
                  ? `${Number(contract.orgAmount).toLocaleString("ru-RU")} ₽`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {contract.notes && (
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-2">Примечания</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {contract.notes}
            </p>
          </div>
        )}
      </div>

      {/* Загрузка файлов */}
      {canEdit && (
        <div className="flex gap-2">
          <ContractFileUpload contractId={contract.id} />
        </div>
      )}

      {/* Файлы */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Сметы</h2>
          <FileListWithDelete
            files={contract.estimates.map((f) => ({
              ...f,
              uploadedAt: f.uploadedAt.toISOString(),
            }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Файлы договора</h2>
          <FileListWithDelete
            files={contractFiles.map((f) => ({
              ...f,
              uploadedAt: f.uploadedAt.toISOString(),
            }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
      </div>

      {invoiceFiles.length > 0 && (
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Счета</h2>
          <FileListWithDelete
            files={invoiceFiles.map((f) => ({
              ...f,
              uploadedAt: f.uploadedAt.toISOString(),
            }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
      )}

      {/* Изображения макетов */}
      {contract.mockupImages.length > 0 && (
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Макеты</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {contract.mockupImages.map((img) => (
              <a
                key={img.id}
                href={`/api/files/${img.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
              >
                <img
                  src={`/api/files/${img.filePath}`}
                  alt={img.fileName}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
