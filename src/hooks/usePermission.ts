"use client";

import { useSession } from "next-auth/react";
import { canAccess, canWrite } from "@/lib/permissions";
import type { Role } from "@/types";

export function usePermission() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return {
    role: user?.role as Role | undefined,
    userId: user?.id as string | undefined,
    canAccess: (section: string) =>
      user ? canAccess(user.role, section, user.hasInfoAccess) : false,
    canWrite: (section: string) =>
      user ? canWrite(user.role, section) : false,
    isDirector: user?.role === "DIRECTOR",
    isManager: user?.role === "MANAGER",
    isProduction: user?.role === "PRODUCTION",
    isDesigner: user?.role === "DESIGNER",
  };
}
