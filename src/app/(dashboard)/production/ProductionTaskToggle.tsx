"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";

interface TaskToggleProps {
  taskId: string;
  projectId: string;
  title: string;
  isCompleted: boolean;
  completedBy: string | null;
  type: "task" | "purchase";
}

export function ProductionTaskToggle({
  taskId,
  projectId,
  title,
  isCompleted,
  completedBy,
  type,
}: TaskToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const apiBase =
    type === "purchase"
      ? `/api/projects/${projectId}/purchases`
      : `/api/projects/${projectId}/tasks`;

  const toggle = async () => {
    setLoading(true);
    const body =
      type === "purchase"
        ? { purchaseId: taskId, isCompleted: !isCompleted }
        : { taskId, isCompleted: !isCompleted };

    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={toggle}
        disabled={loading}
        className="shrink-0 disabled:opacity-50 hover:scale-110 transition-transform"
        title={isCompleted ? "Отменить" : "Выполнено"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
        )}
      </button>
      <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
        {title}
      </span>
      {completedBy && (
        <span className="text-xs text-muted-foreground">— {completedBy}</span>
      )}
    </div>
  );
}
