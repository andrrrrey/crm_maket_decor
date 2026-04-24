import type { Role } from "@/types";

// Пункты меню видимые каждой роли
export const MENU_VISIBILITY: Record<Role, string[]> = {
  DIRECTOR: [
    "dashboard",
    "clients",
    "contracts",
    "calendar",
    "info",
    "inventory",
    "mail",
    "history",
    "messages",
    "settings",
  ],
  MANAGER: [
    "dashboard",
    "clients",
    "contracts",
    "calendar",
    "inventory",
    "mail",
    "history",
    "messages",
    // "info" — только если user.hasInfoAccess === true
  ],
  PRODUCTION: [
    "dashboard",
    "calendar",
    "production",
    "inventory",
    "history",
    "messages",
  ],
  DESIGNER: ["dashboard", "designer", "messages"],
};

// Проверить, имеет ли роль доступ к разделу
export function canAccess(
  role: Role,
  section: string,
  hasInfoAccess = false
): boolean {
  if (section === "info" && role === "MANAGER") {
    return hasInfoAccess;
  }
  return MENU_VISIBILITY[role]?.includes(section) ?? false;
}

// Может ли роль изменять данные (не только читать)
export function canWrite(role: Role, section: string): boolean {
  if (role === "DIRECTOR") return true;

  const writePermissions: Record<string, Role[]> = {
    clients: ["MANAGER"],
    contracts: ["MANAGER"],
    calendar: ["MANAGER"],
    projects: ["MANAGER"],
    production: ["MANAGER", "PRODUCTION"],
    designer: ["DESIGNER"],
    inventory: ["MANAGER", "PRODUCTION"],
    staff: [],
    contractors: [],
    manager: ["MANAGER"],
    messages: ["MANAGER", "PRODUCTION", "DESIGNER"],
  };

  return writePermissions[section]?.includes(role) ?? false;
}

// Проверить, должен ли запрос быть ограничен по менеджеру
export function shouldFilterByManager(role: Role): boolean {
  return role === "MANAGER";
}

// Проверить, должен ли запрос быть ограничен по открытым месяцам
export function shouldFilterByOpenMonths(role: Role): boolean {
  return role === "PRODUCTION";
}

// Может ли пользователь управлять пользователями
export function canManageUsers(role: Role): boolean {
  return role === "DIRECTOR";
}

// Может ли пользователь видеть историю всех пользователей
export function canViewAllHistory(role: Role): boolean {
  return role === "DIRECTOR";
}
