import { prisma } from "./prisma";

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: object
): Promise<void> {
  try {
    await prisma.historyEntry.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ?? undefined,
      },
    });
  } catch (error) {
    // Не прерывать основной поток при ошибке логирования
    console.error("Logger error:", error);
  }
}

// Предопределённые действия
export const Actions = {
  // Клиенты
  CLIENT_CREATE: "client.create",
  CLIENT_UPDATE: "client.update",
  CLIENT_DELETE: "client.delete",
  CLIENT_CONVERT: "client.convert",
  CLIENT_REJECT: "client.reject",

  // Договоры
  CONTRACT_CREATE: "contract.create",
  CONTRACT_UPDATE: "contract.update",
  CONTRACT_DELETE: "contract.delete",

  // Проекты
  PROJECT_CREATE: "project.create",
  PROJECT_UPDATE: "project.update",
  PROJECT_DELETE: "project.delete",
  PROJECT_COMPLETE: "project.complete",

  // Задачи проекта
  TASK_CREATE: "task.create",
  TASK_COMPLETE: "task.complete",
  TASK_DELETE: "task.delete",

  // Инвентарь
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_DELETE: "inventory.delete",
  INVENTORY_DAMAGE: "inventory.damage",

  // Ткани
  FABRIC_CREATE: "fabric.create",
  FABRIC_UPDATE: "fabric.update",
  FABRIC_DELETE: "fabric.delete",

  // Персонал
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",
  STAFF_DELETE: "staff.delete",

  // Подрядчики
  CONTRACTOR_CREATE: "contractor.create",
  CONTRACTOR_UPDATE: "contractor.update",
  CONTRACTOR_DELETE: "contractor.delete",

  // Пользователи
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DEACTIVATE: "user.deactivate",

  // Файлы
  FILE_UPLOAD: "file.upload",
  FILE_DELETE: "file.delete",

  // Настройки
  SETTINGS_OPEN_MONTHS: "settings.openMonths",
} as const;
