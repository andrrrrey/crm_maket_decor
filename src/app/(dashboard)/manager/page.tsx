export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  TaskToggle,
  TaskDeleteButton,
  ExpenseDeleteButton,
  AddTaskForm,
  AddExpenseForm,
} from "./ManagerActions";

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
                <div key={task.id} className="flex items-start gap-2 text-sm group">
                  <TaskToggle taskId={task.id} isCompleted={task.isCompleted} />
                  <div className="flex-1 min-w-0">
                    <p className={task.isCompleted ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        до {format(new Date(task.dueDate), "dd.MM.yyyy", { locale: ru })}
                      </p>
                    )}
                  </div>
                  <TaskDeleteButton taskId={task.id} />
                </div>
              ))
            )}
            <AddTaskForm />
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
                <div key={expense.id} className="flex items-center justify-between text-sm group">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate max-w-[180px]">
                      {expense.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category} ·{" "}
                      {format(new Date(expense.date), "dd.MM.yyyy", { locale: ru })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {Number(expense.amount).toLocaleString("ru-RU")} ₽
                    </span>
                    <ExpenseDeleteButton expenseId={expense.id} />
                  </div>
                </div>
              ))
            )}
            <AddExpenseForm />
          </div>
        </div>
      </div>
    </div>
  );
}
