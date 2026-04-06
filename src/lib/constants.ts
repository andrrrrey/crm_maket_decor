import type { ClientStatus, ContractMockupStatus, ProjectType, Role } from "@/types";

// ==================== РОЛИ ====================

export const ROLE_LABELS: Record<Role, string> = {
  DIRECTOR: "Руководитель",
  MANAGER: "Менеджер",
  PRODUCTION: "Производство",
  DESIGNER: "Дизайнер",
};

// ==================== СТАТУСЫ КЛИЕНТА ====================

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  MEETING: "Встреча",
  DISCUSSION: "Обсуждение",
  ESTIMATE: "Смета",
  CONTRACT: "Договор",
  REJECTED: "Отказ",
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  MEETING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DISCUSSION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ESTIMATE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CONTRACT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// ==================== СТАТУСЫ МАКЕТА ДОГОВОРА ====================

export const MOCKUP_STATUS_LABELS: Record<ContractMockupStatus, string> = {
  APPROVED: "Утверждён",
  WAITING: "Ждут",
  IN_PROGRESS: "На стадии",
  PENDING: "Ожидание",
  TRANSFERRED: "Передан",
  CANCELLED: "Отмена",
};

export const MOCKUP_STATUS_COLORS: Record<ContractMockupStatus, string> = {
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  WAITING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  TRANSFERRED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// ==================== ТИПЫ ПРОЕКТА ====================

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WEDDING: "Свадьба",
  CORPORATE: "Корпоратив",
  BIRTHDAY: "День рождения",
  OTHER: "Другое",
};

// ==================== ЦВЕТА КАЛЕНДАРЯ ====================

export const CALENDAR_COLORS = [
  { value: "#FB923C", label: "Оранжевый (монтаж)" },
  { value: "#60A5FA", label: "Синий (демонтаж)" },
  { value: "#34D399", label: "Зелёный (бронь)" },
  { value: "#FBBF24", label: "Жёлтый" },
  { value: "#A78BFA", label: "Фиолетовый" },
  { value: "#F87171", label: "Красный" },
  { value: "#6EE7B7", label: "Мятный" },
  { value: "#FCA5A5", label: "Коралловый" },
];

// ==================== СЕКЦИИ ПЕРСОНАЛА ====================

export const STAFF_SECTION_LABELS = {
  CORE_TEAM: "Основная команда",
  FREELANCE_MALE: "Фрилансы (парни)",
  FREELANCE_FEMALE: "Фрилансы (девочки)",
  DRIVERS: "Газелисты",
};

// ==================== ФАЙЛОВЫЕ ТИПЫ ====================

export const UPLOAD_DIRS = {
  estimates: "estimates",
  contracts: "contracts",
  invoices: "invoices",
  mockups: "mockups",
  projects: "projects",
  inventory: "inventory",
} as const;

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 52428800; // 50MB

export const ALLOWED_FILE_TYPES = {
  estimates: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
  ],
  contracts: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
  ],
  images: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
