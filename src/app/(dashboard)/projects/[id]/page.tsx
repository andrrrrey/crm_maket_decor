import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { shouldFilterByManager } from "@/lib/permissions";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { ProjectTaskList } from "./ProjectTaskList";
import { ProjectChat } from "./ProjectChat";
import { ProjectEditButton } from "./ProjectEditButton";
import { ProjectImageUpload, ProjectImageDelete } from "./ProjectImages";
import type { Role } from "@/types";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      contract: { select: { id: true, contractNumber: true, clientName: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
      purchases: { orderBy: { sortOrder: "asc" } },
      projectMessages: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      },
      projectImages: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!project) notFound();

  if (shouldFilterByManager(user.role) && project.managerId !== user.id) {
    notFound();
  }

  const canEdit =
    user.role === "DIRECTOR" ||
    user.role === "MANAGER" ||
    user.role === "PRODUCTION";

  // Форма редактирования доступна только директору и менеджеру
  const canEditProject = user.role === "DIRECTOR" || user.role === "MANAGER";

  const [managers, availableContracts] = canEditProject
    ? await Promise.all([
        prisma.user.findMany({
          where: { isActive: true, role: { in: ["DIRECTOR", "MANAGER"] } },
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        }),
        prisma.contract.findMany({
          where: {
            OR: [
              { project: null },
              ...(project.contractId ? [{ id: project.contractId }] : []),
            ],
          },
          select: { id: true, contractNumber: true, clientName: true },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  const completedTasks = project.tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link href="/projects" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: project.calendarColor }}
            />
            <h1 className="text-2xl font-bold">
              {project.venue ?? `Проект #${project.number}`}
            </h1>
            {project.isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Завершён
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(project.date), "dd MMMM yyyy", { locale: ru })} ·{" "}
            {project.manager.name}
          </p>
        </div>
        {canEditProject && (
          <ProjectEditButton
            project={{
              id: project.id,
              venue: project.venue,
              date: project.date,
              description: project.description,
              calendarColor: project.calendarColor,
              isCompleted: project.isCompleted,
              managerId: project.managerId,
              contractId: project.contractId,
            }}
            managers={managers as { id: string; name: string; role: Role }[]}
            availableContracts={availableContracts}
            currentUserRole={user.role as Role}
          />
        )}
      </div>

      {/* Связь с договором */}
      {project.contract && (
        <Link
          href={`/contracts/${project.contract.id}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Договор №{project.contract.contractNumber} — {project.contract.clientName}
        </Link>
      )}

      {/* Описание */}
      {project.description && (
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-2">Описание</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Задачи */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              Задачи производства ({completedTasks}/{project.tasks.length})
            </h2>
          </div>
          {project.tasks.length > 0 && (
            <div className="w-full bg-muted rounded-full h-1.5 mb-3">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          )}
          <ProjectTaskList
            tasks={project.tasks}
            projectId={project.id}
            canEdit={canEdit}
          />
        </div>

        {/* Закупки */}
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">
            Чеклист закупок ({project.purchases.filter((p) => p.isCompleted).length}/{project.purchases.length})
          </h2>
          <ProjectTaskList
            tasks={project.purchases.map((p) => ({
              ...p,
              completedBy: null,
              completedAt: null,
            }))}
            projectId={project.id}
            canEdit={canEdit}
            type="purchase"
          />
        </div>
      </div>

      {/* Фотографии проекта */}
      {canEdit && <ProjectImageUpload projectId={project.id} />}

      {project.projectImages.length > 0 && (
        <div className="space-y-4">
          {/* Эскизы заказа */}
          {project.projectImages.filter((img) => img.imageType === "order").length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h2 className="text-sm font-semibold mb-3">Эскизы заказа</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {project.projectImages
                  .filter((img) => img.imageType === "order")
                  .map((img) => (
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
                          <ProjectImageDelete projectId={project.id} imageId={img.id} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Фото производства */}
          {project.projectImages.filter((img) => img.imageType === "production").length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h2 className="text-sm font-semibold mb-3">Фото производства</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {project.projectImages
                  .filter((img) => img.imageType === "production")
                  .map((img) => (
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
                          <ProjectImageDelete projectId={project.id} imageId={img.id} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Чат проекта */}
      <div className="p-4 rounded-lg border bg-card">
        <h2 className="text-sm font-semibold mb-3">
          Чат проекта ({project.projectMessages.length})
        </h2>
        <ProjectChat
          projectId={project.id}
          initialMessages={project.projectMessages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
