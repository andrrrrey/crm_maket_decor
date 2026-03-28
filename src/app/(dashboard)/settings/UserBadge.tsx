"use client";

import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

const ROLE_COLORS: Record<Role, string> = {
  DIRECTOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PRODUCTION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  DESIGNER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function UserBadge({ role }: { role: Role }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
