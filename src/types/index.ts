import type {
  User,
  Client,
  Contract,
  Project,
  InventoryItem,
  InventoryCategory,
  Fabric,
  Staff,
  Contractor,
  HistoryEntry,
  Notification,
  Message,
  MailEntry,
  Mockup,
  MockupImage,
} from "@prisma/client";

export type { User, Client, Contract, Project };

// Роли пользователей
export type Role = "DIRECTOR" | "MANAGER" | "PRODUCTION" | "DESIGNER";

// Статусы клиента
export type ClientStatus =
  | "MEETING"
  | "DISCUSSION"
  | "ESTIMATE"
  | "CONTRACT"
  | "REJECTED";

// Тип проекта
export type ProjectType = "WEDDING" | "CORPORATE" | "BIRTHDAY" | "OTHER";

// Статус макета договора
export type ContractMockupStatus =
  | "APPROVED"
  | "WAITING"
  | "IN_PROGRESS"
  | "PENDING"
  | "TRANSFERRED"
  | "CANCELLED";

// Секция персонала
export type StaffSection =
  | "CORE_TEAM"
  | "FREELANCE_MALE"
  | "FREELANCE_FEMALE"
  | "DRIVERS";

// Расширенный тип сессии (NextAuth)
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  login: string;
  avatarUrl?: string;
  wallpaper: string;
  theme: string;
  hasInfoAccess: boolean;
}

// Тип ответа API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Пагинация
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// Клиент с менеджером
export type ClientWithManager = Client & {
  manager: Pick<User, "id" | "name">;
  _count?: { estimates: number };
};

// Договор с менеджером
export type ContractWithManager = Contract & {
  organizerName?: string | null;
  manager: Pick<User, "id" | "name">;
  sourceClient?: Pick<Client, "id" | "clientName"> | null;
  mockupImages?: Pick<MockupImage, "id" | "filePath" | "fileName">[];
};

// Проект с менеджером
export type ProjectWithManager = Project & {
  manager: Pick<User, "id" | "name">;
  _count?: { tasks: number; projectMessages: number };
};

// Категория инвентаря с детьми
export type CategoryWithChildren = InventoryCategory & {
  children: CategoryWithChildren[];
  _count?: { items: number };
};

// Элемент инвентаря с категорией
export type InventoryItemWithCategory = InventoryItem & {
  category: InventoryCategory;
  _count?: { damages: number };
};

// Запись истории с пользователем
export type HistoryEntryWithUser = HistoryEntry & {
  user: Pick<User, "id" | "name" | "role">;
};

// Уведомление
export type NotificationItem = Notification;

// Сообщение с пользователем
export type MessageWithUser = Message & {
  user: Pick<User, "id" | "name" | "avatarUrl">;
};

// Макет с дизайнером
export type MockupWithDesigner = Mockup & {
  designer: Pick<User, "id" | "name">;
};

// Данные для формы клиента
export interface ClientFormData {
  dateReceived: string;
  meetingDate?: string;
  projectDate?: string;
  venue?: string;
  projectType: ProjectType;
  status: ClientStatus;
  clientName: string;
  source?: string;
  projectIdea?: string;
}

// Данные для формы договора
export interface ContractFormData {
  contractNumber?: number;
  dateSignedAt: string;
  installDate: string;
  mockupStatus: ContractMockupStatus;
  clientName: string;
  venue?: string;
  totalAmount?: number;
  prepaymentDate?: string;
  prepaymentAmount?: number;
  invoiceNumber?: string;
  orgAmount?: number;
  notes?: string;
}

// Данные для статистики
export interface StatsData {
  totalClients: number;
  totalContracts: number;
  totalProjects: number;
  funnelData: {
    status: ClientStatus;
    count: number;
    label: string;
  }[];
  revenueByMonth: {
    month: string;
    amount: number;
  }[];
  rejectionRate: number;
}
