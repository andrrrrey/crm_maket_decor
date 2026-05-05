import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MockupStatusBadge } from "@/components/shared/StatusBadge";
import { FileListWithDelete } from "@/components/files/FileListWithDelete";
import { format, parseISO, isValid } from "date-fns";
import { ru } from "date-fns/locale";

function formatStringDate(val: string | null | undefined): string {
  if (!val) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const d = parseISO(val);
    if (isValid(d)) return format(d, "dd.MM.yyyy", { locale: ru });
  }
  return val;
}
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  MockupStatusSelect,
  ContractEditForm,
  ContractDeleteButton,
  ContractFileUpload,
  ContractStatusSelect,
  ContractFabricNote,
} from "./ContractEditForm";
import { ContractTaskList } from "./ContractTaskList";
import { ContractImageUpload, ContractImageDelete } from "./ContractImages";
import { ContractChat } from "./ContractChat";
import type { ContractMockupStatus, ContractStatus } from "@/types";

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
      contractImages: { orderBy: { uploadedAt: "desc" } },
      contractTasks: { orderBy: { sortOrder: "asc" } },
      contractPurchases: { orderBy: { sortOrder: "asc" } },
      contractMessages: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      },
      project: { select: { id: true, number: true } },
    },
  });

  if (!contract) notFound();

  const canEdit = user.role === "DIRECTOR" || user.role === "MANAGER";
  const canView = user.role === "DIRECTOR" || user.role === "MANAGER" || user.role === "PRODUCTION";

  const contractFiles = contract.contractFiles.filter((f) => f.fileType === "contract");
  const invoiceFiles = contract.contractFiles.filter((f) => f.fileType === "invoice");

  const productionTasks = contract.contractTasks.filter((t) => t.taskType === "production");
  const generalTasks = contract.contractTasks.filter((t) => t.taskType !== "production");
  const completedProduction = productionTasks.filter((t) => t.isCompleted).length;
  const completedGeneral = generalTasks.filter((t) => t.isCompleted).length;
  const completedPurchases = contract.contractPurchases.filter((p) => p.isCompleted).length;

  const hallImages = contract.contractImages.filter((img) => img.imageType === "hall");
  const ceremonyImages = contract.contractImages.filter((img) => img.imageType === "ceremony");
  const productionImages = contract.contractImages.filter((img) => img.imageType === "production");

  return (
    <div className="max-w-4xl space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link href="/contracts" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              Договор №{contract.contractNumber}
            </h1>
            {canEdit ? (
              <ContractStatusSelect
                contractId={contract.id}
                currentStatus={(contract.contractStatus as ContractStatus) ?? null}
              />
            ) : contract.contractStatus ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-muted">
                {contract.contractStatus === "RESERVATION" ? "Бронь" : "Монтаж"}
              </span>
            ) : null}
            {canEdit ? (
              <MockupStatusSelect
                contract={{
                  id: contract.id,
                  contractNumber: contract.contractNumber,
                  mockupStatus: contract.mockupStatus as ContractMockupStatus,
                  clientName: contract.clientName,
                  organizerName: contract.organizerName ?? null,
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
            {contract.clientName}
            {contract.organizerName && ` · Орг: ${contract.organizerName}`}
            {" · "}Менеджер: {contract.manager.name}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <ContractDeleteButton
              contractId={contract.id}
              managerId={contract.managerId}
              userId={user.id}
              userRole={user.role}
            />
            <ContractEditForm
              contract={{
                id: contract.id,
                contractNumber: contract.contractNumber,
                mockupStatus: contract.mockupStatus as ContractMockupStatus,
                clientName: contract.clientName,
                organizerName: contract.organizerName ?? null,
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
              <dd>{format(new Date(contract.dateSignedAt), "dd.MM.yyyy", { locale: ru })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата монтажа</dt>
              <dd>{format(new Date(contract.installDate), "dd.MM.yyyy", { locale: ru })}</dd>
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
                {contract.prepaymentDate && ` (${formatStringDate(contract.prepaymentDate)})`}
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
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
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
            files={contract.estimates.map((f) => ({ ...f, uploadedAt: f.uploadedAt.toISOString() }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Файлы договора</h2>
          <FileListWithDelete
            files={contractFiles.map((f) => ({ ...f, uploadedAt: f.uploadedAt.toISOString() }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
      </div>

      {invoiceFiles.length > 0 && (
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">Счета</h2>
          <FileListWithDelete
            files={invoiceFiles.map((f) => ({ ...f, uploadedAt: f.uploadedAt.toISOString() }))}
            canDelete={canEdit}
            deleteUrl={`/api/contracts/${contract.id}/files`}
          />
        </div>
      )}

      {/* Макеты (legacy mockupImages) */}
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

      {/* Производство + Задачи */}
      {canView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Производство ({completedProduction}/{productionTasks.length})
              </h2>
            </div>
            {productionTasks.length > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                <div
                  className="bg-orange-400 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${productionTasks.length > 0 ? (completedProduction / productionTasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
            <ContractTaskList
              tasks={productionTasks.map((t) => ({ ...t, completedBy: t.completedBy ?? null }))}
              contractId={contract.id}
              canEdit={canEdit}
              taskType="production"
            />
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Задачи ({completedGeneral}/{generalTasks.length})
              </h2>
            </div>
            {generalTasks.length > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${generalTasks.length > 0 ? (completedGeneral / generalTasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
            <ContractTaskList
              tasks={generalTasks.map((t) => ({ ...t, completedBy: t.completedBy ?? null }))}
              contractId={contract.id}
              canEdit={canEdit}
              taskType="task"
            />
          </div>
        </div>
      )}

      {/* Материалы + Чеклист закупок */}
      {canView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-3">Материалы</h2>
            <ContractFabricNote
              contractId={contract.id}
              initialValue={contract.fabricNote ?? null}
              canEdit={canEdit}
            />
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-3">
              Чеклист закупок ({completedPurchases}/{contract.contractPurchases.length})
            </h2>
            <ContractTaskList
              tasks={contract.contractPurchases.map((p) => ({
                id: p.id,
                title: p.title,
                isCompleted: p.isCompleted,
                completedBy: null,
              }))}
              contractId={contract.id}
              canEdit={canEdit}
              type="purchase"
            />
          </div>
        </div>
      )}

      {/* Изображения */}
      {canView && (
        <div className="space-y-4">
          {/* Рисунок зала */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Рисунок зала</h2>
              {canEdit && <ContractImageUpload contractId={contract.id} imageType="hall" />}
            </div>
            {hallImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {hallImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <a
                      href={`/api/files/${img.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={`/api/files/${img.filePath}`}
                        alt={img.fileName}
                        className="w-full h-full object-cover"
                      />
                    </a>
                    {canEdit && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ContractImageDelete contractId={contract.id} imageId={img.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет изображений</p>
            )}
          </div>

          {/* Рисунок церемонии */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Рисунок церемонии</h2>
              {canEdit && <ContractImageUpload contractId={contract.id} imageType="ceremony" />}
            </div>
            {ceremonyImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ceremonyImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <a
                      href={`/api/files/${img.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={`/api/files/${img.filePath}`}
                        alt={img.fileName}
                        className="w-full h-full object-cover"
                      />
                    </a>
                    {canEdit && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ContractImageDelete contractId={contract.id} imageId={img.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет изображений</p>
            )}
          </div>

          {/* Фото производства */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Фото производства</h2>
              {canEdit && <ContractImageUpload contractId={contract.id} imageType="production" />}
            </div>
            {productionImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {productionImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <a
                      href={`/api/files/${img.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={`/api/files/${img.filePath}`}
                        alt={img.fileName}
                        className="w-full h-full object-cover"
                      />
                    </a>
                    {canEdit && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ContractImageDelete contractId={contract.id} imageId={img.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет изображений</p>
            )}
          </div>
        </div>
      )}

      {/* Чат проекта */}
      {canView && (
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">
            Чат проекта ({contract.contractMessages.length})
          </h2>
          <ContractChat
            contractId={contract.id}
            initialMessages={contract.contractMessages.map((m) => ({
              id: m.id,
              text: m.text,
              createdAt: m.createdAt.toISOString(),
              user: m.user,
            }))}
            currentUserId={user.id}
          />
        </div>
      )}
    </div>
  );
}
