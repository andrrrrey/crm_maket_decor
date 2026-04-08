import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ROLE_LABELS } from "./constants";
import type { Role } from "@/types";

type Details = Record<string, unknown> | null | undefined;

function asObject(details: unknown): Record<string, unknown> {
  if (details && typeof details === "object") {
    return details as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "dd MMMM yyyy", { locale: ru });
}

const FIELD_LABELS: Record<string, string> = {
  date: "дата",
  venue: "название",
  description: "описание",
  calendarColor: "цвет",
  isCompleted: "статус",
  managerId: "менеджер",
  contractId: "договор",
  clientName: "клиент",
  phone: "телефон",
  email: "email",
  name: "имя",
  role: "роль",
  totalAmount: "сумма",
  prepaymentAmount: "предоплата",
  installDate: "дата монтажа",
  mockupStatus: "статус макета",
  notes: "заметки",
  title: "название",
};

function formatChanges(changes: unknown): string {
  const obj = asObject(changes);
  const keys = Object.keys(obj).filter((k) => k !== "id");
  if (keys.length === 0) return "";
  const labels = keys.map((k) => FIELD_LABELS[k] ?? k);
  return ` (${labels.join(", ")})`;
}

export function formatHistoryEntry(
  action: string,
  entityType: string,
  rawDetails: unknown
): string {
  const d = asObject(rawDetails);

  switch (action) {
    // Клиенты
    case "client.create": {
      const name = asString(d.clientName);
      return name ? `Добавил клиента «${name}»` : "Добавил нового клиента";
    }
    case "client.update":
      return `Обновил клиента${formatChanges(d.changes)}`;
    case "client.delete":
      return "Удалил клиента";
    case "client.convert": {
      const name = asString(d.clientName);
      return name
        ? `Перевёл клиента «${name}» в договор`
        : "Перевёл клиента в договор";
    }
    case "client.reject": {
      const reason = asString(d.reason);
      return reason ? `Отказал клиенту: ${reason}` : "Отказал клиенту";
    }

    // Договоры
    case "contract.create": {
      const name = asString(d.clientName);
      return name ? `Создал договор с «${name}»` : "Создал договор";
    }
    case "contract.update":
      return `Обновил договор${formatChanges(d.changes)}`;
    case "contract.delete":
      return "Удалил договор";

    // Проекты
    case "project.create": {
      const venue = asString(d.venue);
      const date = formatDate(d.date);
      if (venue && date) return `Создал проект «${venue}» на ${date}`;
      if (venue) return `Создал проект «${venue}»`;
      if (date) return `Создал проект на ${date}`;
      return "Создал новый проект";
    }
    case "project.update":
      return `Обновил проект${formatChanges(d.changes)}`;
    case "project.complete":
      return "Завершил проект";
    case "project.delete":
      return "Удалил проект";

    // Задачи проекта
    case "task.create": {
      const title = asString(d.title);
      return title ? `Добавил задачу «${title}»` : "Добавил задачу в проект";
    }
    case "task.complete":
      return "Завершил задачу";
    case "task.delete":
      return "Удалил задачу";

    // Инвентарь
    case "inventory.create": {
      const name = asString(d.name);
      return name ? `Добавил в инвентарь «${name}»` : "Добавил позицию в инвентарь";
    }
    case "inventory.update":
      return "Обновил позицию инвентаря";
    case "inventory.delete":
      return "Удалил позицию инвентаря";
    case "inventory.damage": {
      const qty = d.quantity;
      return typeof qty === "number"
        ? `Списал в брак (${qty} шт.)`
        : "Списал позицию в брак";
    }

    // Ткани
    case "fabric.create": {
      const name = asString(d.name);
      return name ? `Добавил ткань «${name}»` : "Добавил ткань";
    }
    case "fabric.update":
      return "Обновил ткань";
    case "fabric.delete":
      return "Удалил ткань";

    // Персонал
    case "staff.create": {
      const name = asString(d.name);
      return name ? `Добавил сотрудника «${name}»` : "Добавил сотрудника";
    }
    case "staff.update":
      return "Обновил данные сотрудника";
    case "staff.delete":
      return "Удалил сотрудника";

    // Подрядчики
    case "contractor.create": {
      const name = asString(d.name);
      return name ? `Добавил подрядчика «${name}»` : "Добавил подрядчика";
    }
    case "contractor.update":
      return "Обновил подрядчика";
    case "contractor.delete":
      return "Удалил подрядчика";

    // Пользователи
    case "user.create": {
      const login = asString(d.login);
      const role = asString(d.role) as Role | null;
      const roleLabel = role && ROLE_LABELS[role] ? ROLE_LABELS[role] : null;
      if (login && roleLabel) return `Создал пользователя ${login} (${roleLabel})`;
      if (login) return `Создал пользователя ${login}`;
      return "Создал нового пользователя";
    }
    case "user.update":
      return `Обновил пользователя${formatChanges(d.changes)}`;
    case "user.deactivate":
      return "Деактивировал пользователя";

    // Файлы
    case "file.upload": {
      const fileName = asString(d.fileName);
      return fileName ? `Загрузил файл «${fileName}»` : "Загрузил файл";
    }
    case "file.delete":
      return "Удалил файл";

    // Настройки
    case "settings.openMonths": {
      const months = Array.isArray(d.openMonths) ? d.openMonths.length : null;
      return months !== null
        ? `Обновил открытые месяцы производства (${months})`
        : "Обновил открытые месяцы производства";
    }

    // Legacy / системные
    case "system.seed":
      return "Начальное заполнение базы";
  }

  // Fallback: без сырого JSON
  return action;
}
