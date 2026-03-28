import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, Circle } from "lucide-react";

export default async function ManagerPage() {
  const session = await auth();
  const user = session?.user as any;

  const [tasks, expenses] = await Promise.all([
    prisma.managerTask.findMany({
      where: { userId: user.id },
      orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Личный кабинет</h1>
      <p className="text-sm text-muted-foreground -mt-4">{user?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Задачи */}
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-sm font-semibold mb-3">
            Задачи ({tasks.filter((t) => !t.isCompleted).length} активных)
          </h2>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет задач</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  {task.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={task.isCompleted ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        до {format(new Date(task.dueDate), "dd.MM.yyyy", { locale: ru })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Расходы */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Расходы</h2>
            <span className="text-sm font-mono">
              {totalExpenses.toLocaleString("ru-RU")} ₽
            </span>
          </div>
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет расходов</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium truncate max-w-[180px]">
                      {expense.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category} ·{" "}
                      {format(new Date(expense.date), "dd.MM.yyyy", { locale: ru })}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    {Number(expense.amount).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
