export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

function projectLabel(p: { number: number; venue: string | null; contract: { clientName: string } | null }) {
  const parts = [p.contract?.clientName, p.venue].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : `Проект #${p.number}`;
}

const STATUS_LABELS: Record<string, string> = {
  MONTAGE: "Монтаж",
  DEMONTAGE: "Демонтаж",
  RESERVATION: "Бронь",
};

const STATUS_COLORS: Record<string, string> = {
  MONTAGE: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  DEMONTAGE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  RESERVATION: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  let year: number;
  let month: number;
  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    [year, month] = searchParams.month.split("-").map(Number);
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const monthParam = searchParams.month ?? `${year}-${String(month).padStart(2, "0")}`;

  const managerFilter = user.role === "MANAGER" ? { managerId: user.id } : {};

  const projects = await prisma.project.findMany({
    where: { date: { gte: startDate, lt: endDate }, ...managerFilter },
    include: {
      manager: { select: { id: true, name: true } },
      contract: { select: { clientName: true } },
      projectImages: {
        select: { id: true, filePath: true, imageType: true },
        orderBy: { uploadedAt: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });

  const monthLabel = format(startDate, "LLLL yyyy", { locale: ru });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/calendar?month=${monthParam}`}
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold capitalize">Проекты — {monthLabel}</h1>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-2 text-left">Дата</th>
              <th className="px-4 py-2 text-left">Площадка</th>
              <th className="px-4 py-2 text-left">Менеджер</th>
              <th className="px-4 py-2 text-center">Рисунок зала</th>
              <th className="px-4 py-2 text-center">Рисунок церемонии</th>
              <th className="px-4 py-2 text-left">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Нет проектов в этом месяце
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const hallImg = project.projectImages.find(
                  (img) => img.imageType === "hall" || img.imageType === "order"
                );
                const ceremonyImg = project.projectImages.find(
                  (img) => img.imageType === "ceremony"
                );

                return (
                  <tr key={project.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="block hover:text-primary">
                        {format(new Date(project.date), "dd.MM.yyyy", { locale: ru })}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:text-primary flex items-center gap-2"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: project.calendarColor }}
                        />
                        {projectLabel(project)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.manager.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hallImg ? (
                        <img
                          src={`/api/files/${hallImg.filePath}`}
                          alt="Зал"
                          className="w-12 h-12 object-cover rounded border mx-auto"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ceremonyImg ? (
                        <img
                          src={`/api/files/${ceremonyImg.filePath}`}
                          alt="Церемония"
                          className="w-12 h-12 object-cover rounded border mx-auto"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[project.projectStatus] ?? STATUS_COLORS.MONTAGE
                        }`}
                      >
                        {STATUS_LABELS[project.projectStatus] ?? project.projectStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
