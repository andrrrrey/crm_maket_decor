import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { OpenMonthsSettings } from "./OpenMonthsSettings";
import { UserBadge } from "./UserBadge";
import { NewUserForm } from "./NewUserForm";
import { UserEditButton, ProfileForm } from "./UserEditForm";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as any;
  const isDirector = canManageUsers(user.role);

  const [users, openMonthsSettings] = await Promise.all([
    isDirector
      ? prisma.user.findMany({
          select: {
            id: true,
            email: true,
            login: true,
            name: true,
            role: true,
            isActive: true,
            phone: true,
            hasInfoAccess: true,
            createdAt: true,
          },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        })
      : [],
    prisma.userSettings.findFirst({
      where: { user: { role: "DIRECTOR" } },
    }),
  ]);

  const openMonths = (openMonthsSettings?.openMonths as string[]) ?? [];

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Настройки</h1>

      {/* Управление открытыми месяцами для производства */}
      {isDirector && (
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Открытые месяцы для производства</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Производство видит только проекты в открытых месяцах
            </p>
          </div>
          <OpenMonthsSettings initialMonths={openMonths} />
        </div>
      )}

      {/* Список пользователей */}
      {isDirector && (
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Пользователи</h2>
              <span className="text-xs text-muted-foreground">{users.length}</span>
            </div>
            <NewUserForm />
          </div>
          <div className="divide-y">
            {users.map((u) => (
              <div
                key={u.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{u.name}</span>
                    <UserBadge role={u.role as Role} />
                    {!u.isActive && (
                      <span className="text-xs text-muted-foreground">(неактивен)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {u.login} · {u.email}
                    {u.phone && ` · ${u.phone}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "dd.MM.yyyy", { locale: ru })}
                  </span>
                  <UserEditButton user={{
                    id: u.id,
                    name: u.name ?? "",
                    email: u.email ?? "",
                    login: u.login,
                    role: u.role as Role,
                    isActive: u.isActive,
                    phone: u.phone,
                    hasInfoAccess: u.hasInfoAccess,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Профиль текущего пользователя */}
      <div className="p-4 rounded-lg border bg-card space-y-3">
        <h2 className="text-sm font-semibold">Мой профиль</h2>
        <dl className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Логин</dt>
            <dd>{(user as any)?.login}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Роль</dt>
            <dd>{ROLE_LABELS[user?.role as Role]}</dd>
          </div>
        </dl>
        <ProfileForm userId={user.id} userName={user.name ?? ""} />
      </div>
    </div>
  );
}
