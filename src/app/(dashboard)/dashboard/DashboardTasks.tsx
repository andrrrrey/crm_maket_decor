"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ProjectTask {
  id: string;
  title: string;
  taskType: string;
  project: {
    id: string;
    venue: string | null;
    number: number;
    manager: { id: string; name: string };
  };
}

interface ManagerTask {
  id: string;
  title: string;
  dueDate: Date | string | null;
  user: { id: string; name: string };
}

function ProjectTaskRow({
  task,
  isDirector,
  onDone,
}: {
  task: ProjectTask;
  isDirector: boolean;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await fetch(`/api/projects/${task.project.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, isCompleted: true }),
    });
    setDone(true);
    setLoading(false);
    onDone();
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/projects/${task.project.id}/tasks?taskId=${task.id}`, {
      method: "DELETE",
    });
    setLoading(false);
    onDone();
  };

  if (done) return null;

  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="truncate">{task.title}</span>
        <span className="text-xs text-muted-foreground ml-1">
          — {task.project.venue ?? `Проект #${task.project.number}`}
        </span>
      </div>
      {isDirector && (
        <span className="text-xs text-muted-foreground shrink-0">
          {task.project.manager.name}
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-950 text-green-600 transition-colors disabled:opacity-50"
          title="Отметить выполненной"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition-colors disabled:opacity-50"
          title="Удалить"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ManagerTaskRow({
  task,
  isDirector,
  onDone,
}: {
  task: ManagerTask;
  isDirector: boolean;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await fetch("/api/manager/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, isCompleted: true }),
    });
    setDone(true);
    setLoading(false);
    onDone();
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/manager/tasks?id=${task.id}`, { method: "DELETE" });
    setLoading(false);
    onDone();
  };

  if (done) return null;

  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="truncate">{task.title}</span>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground ml-1">
            · до {format(new Date(task.dueDate), "dd.MM", { locale: ru })}
          </span>
        )}
      </div>
      {isDirector && (
        <span className="text-xs text-muted-foreground shrink-0">
          {task.user.name}
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-950 text-green-600 transition-colors disabled:opacity-50"
          title="Отметить выполненной"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition-colors disabled:opacity-50"
          title="Удалить"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function DashboardProjectTasks({
  tasks,
  isDirector,
}: {
  tasks: ProjectTask[];
  isDirector: boolean;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет активных задач</p>;
  }

  return (
    <div className="space-y-0.5 max-h-64 overflow-y-auto">
      {tasks.map((task) => (
        <ProjectTaskRow key={task.id} task={task} isDirector={isDirector} onDone={refresh} />
      ))}
    </div>
  );
}

export function DashboardManagerTasks({
  tasks,
  isDirector,
}: {
  tasks: ManagerTask[];
  isDirector: boolean;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет активных задач</p>;
  }

  return (
    <div className="space-y-0.5 max-h-48 overflow-y-auto">
      {tasks.map((task) => (
        <ManagerTaskRow key={task.id} task={task} isDirector={isDirector} onDone={refresh} />
      ))}
    </div>
  );
}
