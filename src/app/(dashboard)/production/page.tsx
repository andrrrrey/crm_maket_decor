import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByOpenMonths } from "@/lib/permissions";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ProductionTaskToggle } from "./ProductionTaskToggle";

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
                  {project.tasks.length > 0 && (
                    <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(completedTasks / project.tasks.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    {project.tasks.map((task) => (
                      <ProductionTaskToggle
                        key={task.id}
                        taskId={task.id}
                        projectId={project.id}
                        title={task.title}
                        isCompleted={task.isCompleted}
                        completedBy={task.completedBy}
                        type="task"
                      />
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
                      <ProductionTaskToggle
                        key={item.id}
                        taskId={item.id}
                        projectId={project.id}
                        title={item.title}
                        isCompleted={item.isCompleted}
                        completedBy={null}
                        type="purchase"
                      />
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
