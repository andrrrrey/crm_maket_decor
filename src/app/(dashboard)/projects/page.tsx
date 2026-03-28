import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByManager, shouldFilterByOpenMonths } from "@/lib/permissions";
import Link from "next/link";
import { Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const where: any = {};

  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  }

  if (searchParams.month) {
    where.month = searchParams.month;
  }

  if (shouldFilterByOpenMonths(user.role)) {
    const settings = await prisma.userSettings.findFirst({
      where: { user: { role: "DIRECTOR" } },
    });
    const openMonths: string[] = (settings?.openMonths as string[]) ?? [];
    where.month = { in: openMonths };
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { date: "asc" },
  });

  // Группировать по месяцам
  const byMonth: Record<string, typeof projects> = {};
  for (const p of projects) {
    if (!byMonth[p.month]) byMonth[p.month] = [];
    byMonth[p.month].push(p);
  }

  const months = Object.keys(byMonth).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Проекты</h1>
        {(user.role === "DIRECTOR" || user.role === "MANAGER") && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый проект
          </Link>
        )}
      </div>

      {months.length === 0 ? (
        <p className="text-muted-foreground">Проектов нет</p>
      ) : (
        months.map((month) => {
          const [year, mon] = month.split("-");
          const monthDate = new Date(parseInt(year), parseInt(mon) - 1, 1);

          return (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider capitalize">
                {format(monthDate, "LLLL yyyy", { locale: ru })}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {byMonth[month].map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.calendarColor }}
                      />
                      <span className="font-medium text-sm truncate">
                        {project.venue ?? `Проект #${project.number}`}
                      </span>
                      {project.isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        {format(new Date(project.date), "dd MMMM yyyy", {
                          locale: ru,
                        })}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{project.manager.name}</span>
                        {project._count.tasks > 0 && (
                          <span>{project._count.tasks} задач</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
