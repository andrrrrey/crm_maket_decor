"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "MONTAGE", label: "Монтаж", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "DEMONTAGE", label: "Демонтаж", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "RESERVATION", label: "Бронь", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
];

export function ProjectStatusSelector({
  projectId,
  currentStatus,
  canEdit,
}: {
  projectId: string;
  currentStatus: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === status || !canEdit) return;
    setLoading(true);
    setStatus(newStatus);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectStatus: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          disabled={loading || !canEdit}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border-2 transition-all",
            status === s.value
              ? `${s.color} border-current`
              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
            !canEdit && "cursor-default"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
