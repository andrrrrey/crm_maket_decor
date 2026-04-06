import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  const user = session.user as any;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="text-6xl">🌸</div>
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Добро пожаловать, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {ROLE_LABELS[user?.role as Role] ?? user?.role} · Maket Decor CRM
        </p>
      </div>
    </div>
  );
}
