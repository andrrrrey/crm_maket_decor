"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  completedBy: string | null;
  completedAt: Date | null;
}

interface ProjectTaskListProps {
  tasks: Task[];
  projectId: string;
  canEdit: boolean;
  type?: "task" | "purchase";
}

export function ProjectTaskList({
  tasks,
  projectId,
  canEdit,
  type = "task",
}: ProjectTaskListProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const apiBase =
    type === "purchase"
      ? `/api/projects/${projectId}/purchases`
      : `/api/projects/${projectId}/tasks`;

  const toggleTask = async (task: Task) => {
    setLoading(task.id);
    const body =
      type === "purchase"
        ? { purchaseId: task.id, isCompleted: !task.isCompleted }
        : { taskId: task.id, isCompleted: !task.isCompleted };

    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    router.refresh();
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    setAdding(false);
    router.refresh();
  };

  const deleteTask = async (id: string) => {
    const param = type === "purchase" ? "purchaseId" : "taskId";
    await fetch(`${apiBase}?${param}=${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-2 group py-1"
        >
          <button
            onClick={() => canEdit && toggleTask(task)}
            disabled={loading === task.id}
            className={cn(
              "shrink-0 transition-colors",
              task.isCompleted ? "text-green-500" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {task.isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          <span
            className={cn(
              "flex-1 text-sm",
              task.isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          {task.completedBy && (
            <span className="text-xs text-muted-foreground hidden group-hover:block">
              {task.completedBy}
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="flex items-center gap-2 pt-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Добавить пункт..."
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1 text-sm px-2 py-1 border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
          <button
            onClick={addTask}
            disabled={adding || !newTitle.trim()}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
