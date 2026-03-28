import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByOpenMonths } from "@/lib/permissions";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, Circle } from "lucide-react";

export default async function ProductionPage() {
  const session = await auth();
  const user = session?.user as any;

  const where: any = {};

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
      tasks: { orderBy: { sortOrder: "asc" } },
      purchases: { orderBy: { sortOrder: "asc" } },
      manager: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Производство</h1>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">Нет открытых проектов</p>
      ) : (
        projects.map((project) => {
          const completedTasks = project.tasks.filter((t) => t.isCompleted).length;
          const completedPurchases = project.purchases.filter((p) => p.isCompleted).length;

          return (
            <div key={project.id} className="p-4 rounded-lg border bg-card space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: project.calendarColor }}
                />
                <div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {project.venue ?? `Проект #${project.number}`}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(project.date), "dd MMMM yyyy", { locale: ru })} ·{" "}
                    {project.manager.name}
                  </p>
                </div>
              </div>

              {/* Задачи */}
              {project.tasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Задачи ({completedTasks}/{project.tasks.length})
                  </h3>
                  <div className="space-y-1">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        {task.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={task.isCompleted ? "line-through text-muted-foreground" : ""}>
                          {task.title}
                        </span>
                        {task.completedBy && (
                          <span className="text-xs text-muted-foreground">
                            — {task.completedBy}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Закупки */}
              {project.purchases.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Закупки ({completedPurchases}/{project.purchases.length})
                  </h3>
                  <div className="space-y-1">
                    {project.purchases.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={item.isCompleted ? "line-through text-muted-foreground" : ""}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
