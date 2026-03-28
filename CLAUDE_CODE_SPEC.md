# ТЕХНИЧЕСКОЕ ЗАДАНИЕ ДЛЯ CLAUDE CODE
# CRM-система «Maket Decor»

---

## 1. ОБЗОР ПРОЕКТА

CRM-система для студии декора мероприятий. Управление клиентами (воронка продаж), проектами, производством, складом (инвентарь + ткани), персоналом, внутренними коммуникациями и аналитикой.

**Пользователи**: 4 роли — Руководитель, Менеджер, Производство, Дизайнер.
**Ключевая особенность**: строгое разграничение доступа — менеджеры не видят друг друга, производство видит только свои задачи и открытые руководителем месяцы.

---

## 2. СТЕК ТЕХНОЛОГИЙ

```
┌─────────────────────────────────────────────────┐
│                   NGINX                         │
│            (reverse proxy + SSL)                │
├────────────────────┬────────────────────────────┤
│                    │                            │
│   Next.js App      │   Socket.io Server         │
│   (App Router)     │   (встроен в custom server) │
│   Port 3000        │   Port 3000 /socket.io     │
│                    │                            │
├────────────────────┴────────────────────────────┤
│              BullMQ Worker                      │
│        (фоновые задачи: почта, уведомления)     │
├────────────────────┬────────────────────────────┤
│   PostgreSQL 16    │      Redis 7               │
│   Port 5432        │      Port 6379             │
└────────────────────┴────────────────────────────┘
│              Volumes                            │
│   ./data/postgres  ./data/redis  ./uploads      │
└─────────────────────────────────────────────────┘
```

### Пакеты и версии

| Назначение | Пакет | Примечание |
|---|---|---|
| Фреймворк | `next@14` (App Router) | Pages API для custom server |
| ORM | `prisma` + `@prisma/client` | Миграции, типизация |
| БД | PostgreSQL 16 | Docker-контейнер |
| Аутентификация | `next-auth@5` (Auth.js) | Credentials provider, JWT сессии |
| Валидация | `zod` | Схемы для API и форм |
| UI | `tailwindcss` + `shadcn/ui` | Компоненты, тёмная/светлая тема |
| Таблицы | `@tanstack/react-table` | Сортировка, фильтрация, пагинация |
| Формы | `react-hook-form` + `@hookform/resolvers/zod` | |
| Файлы | `multer` или `formidable` | Загрузка в локальную папку |
| WebSocket | `socket.io` + `socket.io-client` | Чат, уведомления в реальном времени |
| Очереди | `bullmq` | Фоновые задачи (email, уведомления) |
| Кэш/сессии | `redis` (ioredis) | Для BullMQ и Socket.io adapter |
| Графики | `recharts` | Дашборды статистики |
| Календарь | Кастомный компонент | Сетка ПН-ВС с цветовым кодированием |
| Иконки | `lucide-react` | |
| Даты | `date-fns` | Форматирование, локаль ru |
| Email | `nodemailer` | Приём/отправка (через BullMQ worker) |
| Хэширование | `bcryptjs` | Пароли |

---

## 3. СТРУКТУРА ПРОЕКТА

```
maket-decor-crm/
├── docker-compose.yml
├── Dockerfile
├── nginx/
│   └── nginx.conf
├── .env.example
├── package.json
├── next.config.js
├── server.js                    # Custom server (Socket.io + Next.js)
├── worker.js                    # BullMQ worker (фоновые задачи)
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # Начальные данные (роли, admin)
├── public/
│   └── wallpapers/              # 15 фоновых заставок
├── uploads/                     # Монтируется как Docker volume
│   ├── estimates/               # Сметы (Excel-файлы)
│   ├── contracts/               # Договоры (Word/PDF)
│   ├── invoices/                # Счета
│   ├── mockups/                 # Макеты дизайнера
│   ├── projects/                # Фото проектов
│   └── inventory/               # Фото склада
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (ThemeProvider, AuthProvider)
│   │   ├── page.tsx             # Redirect → /dashboard или /login
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── (dashboard)/         # Route group — layout с боковым меню
│   │   │   ├── layout.tsx       # Sidebar + Header + Content area
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Главная с заставкой
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx     # Таблица входящих клиентов
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Карточка клиента (смета, файлы)
│   │   │   ├── contracts/
│   │   │   │   ├── page.tsx     # Таблица договоров
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Карточка договора (файлы, макет)
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx     # Годовой календарь проектов
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx     # Проекты по месяцам
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Карточка проекта (задачи, чат, файлы)
│   │   │   ├── production/
│   │   │   │   └── page.tsx     # Вкладки производства
│   │   │   ├── designer/
│   │   │   │   └── page.tsx     # Таблица макетов дизайнера
│   │   │   ├── manager/
│   │   │   │   └── page.tsx     # Персональный кабинет менеджера
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx     # Склад — инвентарь
│   │   │   │   └── fabrics/
│   │   │   │       └── page.tsx # Склад — ткани
│   │   │   ├── info/
│   │   │   │   ├── staff/
│   │   │   │   │   └── page.tsx # Персонал
│   │   │   │   └── contractors/
│   │   │   │       └── page.tsx # Подрядчики
│   │   │   ├── mail/
│   │   │   │   └── page.tsx     # Входящие заявки с сайта
│   │   │   ├── stats/
│   │   │   │   └── page.tsx     # Статистика и дашборды
│   │   │   ├── history/
│   │   │   │   └── page.tsx     # Лог действий
│   │   │   ├── messages/
│   │   │   │   └── page.tsx     # Внутренний чат команды
│   │   │   └── settings/
│   │   │       └── page.tsx     # Настройки (пользователи, тема)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── clients/
│   │       │   ├── route.ts     # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts # GET, PUT, DELETE
│   │       │       ├── convert/
│   │       │       │   └── route.ts  # POST — перевести в договор
│   │       │       ├── reject/
│   │       │       │   └── route.ts  # POST — отказ
│   │       │       └── files/
│   │       │           └── route.ts  # GET, POST — файлы смет
│   │       ├── contracts/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── files/
│   │       │           └── route.ts  # Файлы договора, счёта
│   │       ├── projects/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── tasks/
│   │       │       │   └── route.ts  # Задачи производства
│   │       │       ├── purchases/
│   │       │       │   └── route.ts  # Чеклист закупок
│   │       │       └── chat/
│   │       │           └── route.ts  # Сообщения по проекту
│   │       ├── calendar/
│   │       │   └── route.ts          # Данные для календаря
│   │       ├── designer/
│   │       │   └── route.ts
│   │       ├── inventory/
│   │       │   ├── route.ts          # Инвентарь
│   │       │   ├── categories/
│   │       │   │   └── route.ts
│   │       │   └── fabrics/
│   │       │       └── route.ts      # Ткани
│   │       ├── staff/
│   │       │   └── route.ts
│   │       ├── contractors/
│   │       │   └── route.ts
│   │       ├── manager/
│   │       │   ├── tasks/
│   │       │   │   └── route.ts
│   │       │   └── expenses/
│   │       │       └── route.ts
│   │       ├── mail/
│   │       │   └── route.ts
│   │       ├── stats/
│   │       │   └── route.ts
│   │       ├── history/
│   │       │   └── route.ts
│   │       ├── messages/
│   │       │   └── route.ts
│   │       ├── search/
│   │       │   └── route.ts          # Общий поиск
│   │       ├── upload/
│   │       │   └── route.ts          # Универсальный upload endpoint
│   │       └── users/
│   │           └── route.ts          # Управление пользователями
│   ├── components/
│   │   ├── ui/                       # shadcn/ui компоненты
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Боковое меню (адаптивное по роли)
│   │   │   ├── Header.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── tables/
│   │   │   ├── DataTable.tsx         # Базовый компонент таблицы
│   │   │   ├── ClientsTable.tsx
│   │   │   ├── ContractsTable.tsx
│   │   │   └── ...
│   │   ├── calendar/
│   │   │   ├── YearCalendar.tsx      # Годовой календарь-сетка
│   │   │   └── CalendarCell.tsx      # Ячейка с цветом и проектами
│   │   ├── files/
│   │   │   ├── FileUpload.tsx        # Загрузка файлов
│   │   │   └── FileList.tsx          # Список прикреплённых файлов
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx        # Окно чата (Socket.io)
│   │   │   └── MessageBubble.tsx
│   │   ├── stats/
│   │   │   ├── FunnelChart.tsx       # Воронка продаж
│   │   │   └── StatsCards.tsx
│   │   └── shared/
│   │       ├── StatusBadge.tsx        # Цветные кнопки-статусы
│   │       ├── ColorPicker.tsx        # Выбор цвета ячейки календаря
│   │       └── SearchGlobal.tsx       # Общий поиск
│   ├── lib/
│   │   ├── prisma.ts                 # Singleton Prisma client
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── socket.ts                 # Socket.io client instance
│   │   ├── queue.ts                  # BullMQ queue definitions
│   │   ├── upload.ts                 # File upload helpers
│   │   ├── permissions.ts            # Проверка прав по роли
│   │   ├── logger.ts                 # Запись в таблицу History
│   │   └── constants.ts              # Статусы, роли, цвета
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useNotifications.ts
│   │   └── usePermission.ts
│   ├── types/
│   │   └── index.ts                  # TypeScript типы
│   └── middleware.ts                 # Auth middleware (защита роутов)
```

---

## 4. СХЕМА БАЗЫ ДАННЫХ (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ПОЛЬЗОВАТЕЛИ И РОЛИ ====================

enum Role {
  DIRECTOR    // Руководитель
  MANAGER     // Менеджер
  PRODUCTION  // Производство
  DESIGNER    // Дизайнер
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  login         String   @unique
  passwordHash  String
  name          String
  role          Role
  isActive      Boolean  @default(true)
  phone         String?
  avatarUrl     String?
  wallpaper     String   @default("default")  // Имя файла заставки
  theme         String   @default("light")     // light | dark
  createdAt     DateTime @default(now())

  // Связи
  clients          Client[]        @relation("ManagerClients")
  contracts        Contract[]      @relation("ManagerContracts")
  projects         Project[]       @relation("ManagerProjects")
  designerMockups  Mockup[]        @relation("DesignerMockups")
  managerTasks     ManagerTask[]
  expenses         Expense[]
  messages         Message[]
  projectMessages  ProjectMessage[]
  historyEntries   HistoryEntry[]
  notifications    Notification[]

  // Доступ менеджера к разделу ИНФО
  hasInfoAccess    Boolean  @default(false)
}

model UserSettings {
  id            String   @id @default(cuid())
  userId        String   @unique
  // Для руководителя: какие месяцы открыты производству
  openMonths    Json     @default("[]")  // ["2026-01", "2026-02", ...]
}

// ==================== ВХОДЯЩИЕ КЛИЕНТЫ ====================

enum ClientStatus {
  MEETING       // Встреча
  DISCUSSION    // Обсуждение
  ESTIMATE      // Смета
  CONTRACT      // Договор (→ перенос)
  REJECTED      // Отказ
}

enum ProjectType {
  WEDDING       // Свадьба
  CORPORATE     // Корпоратив
  BIRTHDAY      // День рождения
  OTHER         // Другое
}

model Client {
  id              String       @id @default(cuid())
  number          Int          @default(autoincrement())
  dateReceived    DateTime     // Дата обращения
  meetingDate     String?      // Дата встречи (текст, т.к. может быть "выбирает дату")
  projectDate     DateTime?    // Планируемая дата мероприятия
  venue           String?      // Ресторан/площадка
  projectType     ProjectType  @default(WEDDING)
  status          ClientStatus @default(MEETING)
  clientName      String       // Имена клиента
  source          String?      // Орг/реклама (БУО, имя организатора)
  projectIdea     String?      // Основная идея проекта (длинный текст)
  rejectionReason String?      // Причина отказа
  isRejected      Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Связи
  managerId       String
  manager         User         @relation("ManagerClients", fields: [managerId], references: [id])
  estimates       EstimateFile[]
  contract        Contract?    // После перевода в договор
}

// ==================== ФАЙЛЫ СМЕТ ====================

model EstimateFile {
  id          String   @id @default(cuid())
  clientId    String?
  contractId  String?
  fileName    String   // Оригинальное имя файла
  filePath    String   // Путь на диске
  fileSize    Int
  version     Int      @default(1)  // Версия сметы (1-10)
  isTeamVersion Boolean @default(false)  // true = ТЗ для команды (без цен)
  uploadedAt  DateTime @default(now())

  client      Client?   @relation(fields: [clientId], references: [id])
  contract    Contract? @relation(fields: [contractId], references: [id])
}

// ==================== ДОГОВОРЫ ====================

enum ContractMockupStatus {
  APPROVED      // Утверждён
  WAITING       // Ждут
  IN_PROGRESS   // На стадии
  PENDING       // Ожидание
  TRANSFERRED   // Передан
  CANCELLED     // Отмена
}

model Contract {
  id                String              @id @default(cuid())
  contractNumber    Int                 @default(autoincrement())  // № договора
  dateSignedAt      DateTime            // Дата заключения
  installDate       DateTime            // Дата монтажа
  mockupStatus      ContractMockupStatus @default(PENDING)
  clientName        String              // Заказчик (имена)
  venue             String?             // Ресторан
  totalAmount       Decimal?            // Общая сумма
  prepaymentDate    String?             // Дата предоплаты (текст)
  prepaymentAmount  Decimal?            // Сумма предоплаты
  invoiceNumber     String?             // № счета
  orgAmount         Decimal?            // Сумма орг
  notes             String?             // Примечания
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  // Связи
  managerId         String
  manager           User                @relation("ManagerContracts", fields: [managerId], references: [id])
  sourceClientId    String?             @unique
  sourceClient      Client?             @relation(fields: [sourceClientId], references: [id])
  estimates         EstimateFile[]      // Файлы смет
  contractFiles     ContractFile[]      // Файлы договора, счёта
  project           Project?            // Связанный проект
  mockupImages      MockupImage[]       // Изображения макетов
}

model ContractFile {
  id          String   @id @default(cuid())
  contractId  String
  fileName    String
  filePath    String
  fileSize    Int
  fileType    String   // "contract" | "invoice" | "other"
  uploadedAt  DateTime @default(now())

  contract    Contract @relation(fields: [contractId], references: [id])
}

model MockupImage {
  id          String   @id @default(cuid())
  contractId  String
  fileName    String
  filePath    String
  uploadedAt  DateTime @default(now())

  contract    Contract @relation(fields: [contractId], references: [id])
}

// ==================== ПРОЕКТЫ И КАЛЕНДАРЬ ====================

model Project {
  id              String    @id @default(cuid())
  number          Int       @default(autoincrement())
  date            DateTime  // Дата монтажа
  venue           String?   // Площадка
  description     String?   // Описание (длинный текст, сворачиваемый)
  month           String    // "2026-01" — для фильтрации по месяцам
  calendarColor   String    @default("#F472B6")  // Цвет ячейки в календаре
  isCompleted     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Связи
  managerId       String
  manager         User      @relation("ManagerProjects", fields: [managerId], references: [id])
  contractId      String?   @unique
  contract        Contract? @relation(fields: [contractId], references: [id])

  tasks           ProjectTask[]       // Задачи производства
  purchases       ProjectPurchase[]   // Чеклист закупок
  projectMessages ProjectMessage[]    // Чат по проекту (СМС)
  projectImages   ProjectImage[]      // Фото проекта
  teamEstimate    String?             // Путь к файлу ТЗ для команды
}

// Ячейки календаря (для множественных проектов в одной дате и доп. меток)
model CalendarEntry {
  id          String   @id @default(cuid())
  date        DateTime // Конкретная дата
  label       String   // Название (напр. "МАРШАЛ", "ДЕМ ЮТЕЙР")
  color       String   // Цвет ячейки: розовый=монтаж, синий=демонтаж, зелёный=бронь
  entryType   String   // "install" | "uninstall" | "booking" | "custom"
  projectId   String?
}

model ProjectTask {
  id            String   @id @default(cuid())
  projectId     String
  title         String   // Текст задачи
  isCompleted   Boolean  @default(false)
  completedBy   String?  // Имя того, кто выполнил
  completedAt   DateTime?
  sortOrder     Int      @default(0)

  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectPurchase {
  id            String   @id @default(cuid())
  projectId     String
  title         String   // Что закупить
  isCompleted   Boolean  @default(false)
  sortOrder     Int      @default(0)

  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectMessage {
  id          String   @id @default(cuid())
  projectId   String
  userId      String
  text        String
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
}

model ProjectImage {
  id          String   @id @default(cuid())
  projectId   String
  fileName    String
  filePath    String
  imageType   String   // "order" (рисунок заказа) | "production" (рисунок производства)
  uploadedAt  DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ==================== ДИЗАЙНЕР ====================

model Mockup {
  id              String   @id @default(cuid())
  number          Int      @default(autoincrement())
  month           String   // "2026-01" — для группировки по месяцам/ЗП
  startDate       DateTime
  installDate     DateTime?
  daysToComplete  Int?
  status          String   @default("drawing")  // "drawing" | "closed"
  complexity      Int?     // 1-5
  notes           String?
  createdAt       DateTime @default(now())

  designerId      String
  designer        User     @relation("DesignerMockups", fields: [designerId], references: [id])

  images          MockupImageFile[]
}

model MockupImageFile {
  id          String   @id @default(cuid())
  mockupId    String
  fileName    String
  filePath    String
  zone        String   // "ceremony" | "presidium_hall"
  uploadedAt  DateTime @default(now())

  mockup      Mockup   @relation(fields: [mockupId], references: [id], onDelete: Cascade)
}

// ==================== СКЛАД: ИНВЕНТАРЬ ====================

model InventoryCategory {
  id          String   @id @default(cuid())
  name        String   // "Столы", "Посуда для гостей", "Свечи"...
  parentId    String?  // Древовидная структура
  sortOrder   Int      @default(0)

  parent      InventoryCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    InventoryCategory[] @relation("CategoryTree")
  items       InventoryItem[]
}

model InventoryItem {
  id          String   @id @default(cuid())
  categoryId  String
  name        String   // "Бокал для вина"
  color       String?  // "Графит", "красный"
  quantity    Int      @default(0)
  photoUrl    String?  // Путь к фото
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    InventoryCategory @relation(fields: [categoryId], references: [id])
  damages     InventoryDamage[]
}

model InventoryDamage {
  id          String   @id @default(cuid())
  itemId      String
  quantity    Int      // Кол-во разбито/сломано
  description String?  // "20.06. Разбито 1 шт. На свадьбе Камнево"
  date        DateTime @default(now())

  item        InventoryItem @relation(fields: [itemId], references: [id])
}

// ==================== СКЛАД: ТКАНИ ====================

model Fabric {
  id          String   @id @default(cuid())
  material    String   // "БАРХАТ", "ШЁЛК", "КАНВАС"
  color       String   // "Чёрный", "Красный", "Пудра"
  width       Int?     // Ширина в см (напр. 300)
  cuts        String?  // Описание отрезов: "4м-4шт, 6м-8шт..."
  quantity    Int?     // Кол-во (если считается штуками)
  totalLength Decimal? // Итого метров
  yearBought  String?  // "2024", "2025"
  supplier    String?  // "Мухамад МСК"
  notes       String?  // Примечания
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ==================== ИНФО: ПЕРСОНАЛ ====================

enum StaffSection {
  CORE_TEAM        // Основная команда
  FREELANCE_MALE   // Фрилансы парни
  FREELANCE_FEMALE // Фрилансы девочки
  DRIVERS          // Газелисты
}

model Staff {
  id          String       @id @default(cuid())
  section     StaffSection
  fullName    String
  position    String       // "Руководитель", "Монтажник", "Декоратор"
  passport    String?      // Зашифровано
  birthDate   DateTime?
  age         Int?
  startDate   String?      // "апрель 2018", "июнь 2024"
  address     String?
  phone       String?
  hasVehicle  String?      // "есть авто", "нет авто", "Частн"
  telegramLink String?     // Ссылка на ТГ
  notes       String?
}

// ==================== ИНФО: ПОДРЯДЧИКИ ====================

model Contractor {
  id            String   @id @default(cuid())
  category      String   // "БУМАГА", "МАТЕРИАЛЫ закуп", "ПЕЧАТЬ ПЛЕНКИ"
  companyName   String   // "ЗЕНОН", "Синий филин"
  address       String?
  phone         String?
  notes         String?  // Подробные примечания
  telegramLink  String?
  recordedBy    String?  // "Александра"
}

// ==================== МЕНЕДЖЕР: ЗАДАЧИ И РАСХОДЫ ====================

model ManagerTask {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  dueDate     DateTime?
  isCompleted Boolean  @default(false)
  imageUrl    String?  // Прикреплённое изображение
  assignedBy  String?  // Кто назначил (для производства)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model Expense {
  id          String   @id @default(cuid())
  userId      String
  category    String   // "general" | "consumables" | "project"
  projectId   String?  // Привязка к проекту (если project)
  description String
  amount      Decimal
  date        DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

// ==================== ПОЧТА ====================

model MailEntry {
  id          String   @id @default(cuid())
  fromEmail   String
  subject     String
  body        String
  isRead      Boolean  @default(false)
  receivedAt  DateTime @default(now())
  assignedTo  String?  // ID менеджера (если назначено)
}

// ==================== СООБЩЕНИЯ (ЧАТ) ====================

model Message {
  id          String   @id @default(cuid())
  userId      String
  text        String
  fileUrl     String?  // Прикреплённый файл
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

// ==================== ИСТОРИЯ ====================

model HistoryEntry {
  id          String   @id @default(cuid())
  userId      String
  action      String   // "client.create", "contract.update", "inventory.damage" и т.д.
  entityType  String   // "client", "contract", "project", "inventory"
  entityId    String?
  details     Json?    // { field: "status", old: "meeting", new: "contract" }
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

// ==================== УВЕДОМЛЕНИЯ ====================

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  body        String?
  isRead      Boolean  @default(false)
  link        String?  // URL для перехода
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 5. МАТРИЦА ДОСТУПА (permissions.ts)

```typescript
// Какие разделы видны каждой роли в боковом меню
export const MENU_VISIBILITY: Record<Role, string[]> = {
  DIRECTOR: [
    'dashboard', 'clients', 'contracts', 'calendar', 'projects',
    'production', 'designer', 'manager', 'info', 'inventory',
    'mail', 'stats', 'history', 'messages', 'settings'
  ],
  MANAGER: [
    'dashboard', 'clients', 'contracts', 'calendar', 'projects',
    'production', 'designer', 'manager', 'inventory',
    'mail', 'stats', 'history', 'messages'
    // 'info' — только если user.hasInfoAccess === true
  ],
  PRODUCTION: [
    'dashboard', 'calendar', 'production', 'inventory', 'history', 'messages'
  ],
  DESIGNER: [
    'dashboard', 'designer', 'messages'
  ],
};

// Правила фильтрации данных
// - DIRECTOR: видит ВСЁ, может фильтровать по менеджерам
// - MANAGER: видит ТОЛЬКО СВОИ данные (where: { managerId: userId })
// - PRODUCTION: Календарь — только открытые месяцы (UserSettings.openMonths)
// - PRODUCTION: История — только свои записи (where: { userId })
// - MANAGER: История — свои + производство
```

---

## 6. КЛЮЧЕВЫЕ БИЗНЕС-ЛОГИКИ

### 6.1. Воронка: Клиент → Договор

```
POST /api/clients/[id]/convert

1. Проверить что клиент в статусе, позволяющем перевод
2. Создать запись Contract, скопировав данные из Client
3. Перенести EstimateFile записи (clientId → contractId)
4. Обновить Client.status = CONTRACT
5. Записать в HistoryEntry
6. Вернуть ID нового договора
```

### 6.2. Воронка: Клиент → Отказ

```
POST /api/clients/[id]/reject
body: { reason: string }

1. Обновить Client.status = REJECTED, Client.isRejected = true
2. Записать Client.rejectionReason
3. Записать в HistoryEntry
4. Клиент пропадает из основной таблицы (фильтр isRejected = false)
5. Остаётся в аналитике
```

### 6.3. Управление видимостью месяцев для производства

```
PUT /api/settings/open-months
body: { months: ["2026-04", "2026-05"] }

Только DIRECTOR. Обновляет UserSettings.openMonths.
При запросе /api/projects для роли PRODUCTION — фильтр по openMonths.
```

### 6.4. Логирование действий

```typescript
// lib/logger.ts
async function logAction(
  userId: string,
  action: string,        // "client.create"
  entityType: string,    // "client"
  entityId?: string,
  details?: object
) {
  await prisma.historyEntry.create({
    data: { userId, action, entityType, entityId, details }
  });
}

// Вызывается во ВСЕХ мутациях (create, update, delete)
```

---

## 7. DOCKER COMPOSE

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://maket:${DB_PASSWORD}@postgres:5432/maketcrm
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - UPLOAD_DIR=/app/uploads
    volumes:
      - ./uploads:/app/uploads
      - ./public/wallpapers:/app/public/wallpapers
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  worker:
    build: .
    command: node worker.js
    environment:
      - DATABASE_URL=postgresql://maket:${DB_PASSWORD}@postgres:5432/maketcrm
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=maket
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=maketcrm
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - ./data/redis:/data
    ports:
      - "127.0.0.1:6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - app
    restart: unless-stopped
```

---

## 8. CUSTOM SERVER (server.js)

```javascript
// server.js — Next.js + Socket.io на одном порте
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(server, {
    path: '/socket.io',
    cors: { origin: process.env.NEXTAUTH_URL }
  });

  // Redis adapter для масштабирования
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // Socket.io обработчики
  io.on('connection', (socket) => {
    // Аутентификация через JWT из cookie
    // Подписка на комнаты: project:{id}, general, user:{id}
    // Обработка: chat:send, notification:read
  });

  // Сделать io доступным для API routes через global
  global.io = io;

  server.listen(3000, () => {
    console.log('> Server ready on http://localhost:3000');
  });
});
```

---

## 9. ПОРЯДОК РАЗРАБОТКИ (для Claude Code)

### Фаза 1: Каркас (первым делом)
1. `docker-compose.yml` + `Dockerfile` + `nginx.conf`
2. `npx create-next-app` с TypeScript, Tailwind, App Router
3. `prisma/schema.prisma` — вся схема БД
4. `npx prisma migrate dev` — первая миграция
5. `prisma/seed.ts` — создать admin-пользователя (DIRECTOR)
6. NextAuth config (credentials provider, JWT)
7. `middleware.ts` — защита всех `/dashboard/*` роутов
8. Layout: Sidebar (адаптивный по роли) + Header + ThemeProvider
9. Страница логина
10. Страница настроек (управление пользователями, тема, заставка)

### Фаза 2: Клиенты и договоры
11. API: `/api/clients` — CRUD + фильтрация по роли
12. Страница `/clients` — DataTable с цветными статусами
13. Карточка клиента `/clients/[id]` — форма + загрузка смет
14. API: `/api/clients/[id]/convert` — перевод в договор
15. API: `/api/clients/[id]/reject` — отказ
16. API: `/api/contracts` — CRUD
17. Страница `/contracts` — DataTable
18. Карточка договора `/contracts/[id]` — файлы, макет
19. API + компонент загрузки файлов (FileUpload, FileList)
20. `lib/logger.ts` + логирование всех мутаций

### Фаза 3: Проекты и производство
21. API: `/api/calendar` — данные для годового календаря
22. Компонент `YearCalendar` — сетка ПН-ВС, цвета, проекты
23. API: `/api/projects` — CRUD + фильтрация по месяцам
24. Страница `/projects` — вкладки по месяцам
25. Карточка проекта `/projects/[id]` — задачи, закупки, фото
26. Компоненты чеклистов (задачи, закупки) с галочками
27. `server.js` — Socket.io интеграция
28. Чат по проекту (ProjectMessage + Socket.io)
29. API + страница `/designer` — макеты дизайнера
30. Управление видимостью месяцев для производства

### Фаза 4: Склад и справочники
31. API: `/api/inventory/categories` — CRUD древовидных категорий
32. API: `/api/inventory` — CRUD товаров + фото + убыток
33. Страница `/inventory` — дерево + таблица + фото
34. API: `/api/inventory/fabrics` — CRUD тканей
35. Страница `/inventory/fabrics` — список тканей
36. API: `/api/staff` + страница `/info/staff`
37. API: `/api/contractors` + страница `/info/contractors`
38. API + страница `/manager` — задачи, расходы, ЗП
39. Вкладки менеджера: задачи (график), расходы, расходники

### Фаза 5: Аналитика, коммуникации, финал
40. API: `/api/stats` — агрегации для дашбордов
41. Страница `/stats` — воронка, графики (recharts)
42. API + страница `/history` — лог с фильтрацией по ролям
43. API + страница `/mail` — входящие заявки
44. `worker.js` — BullMQ worker (проверка почты, уведомления)
45. API + страница `/messages` — общий чат (Socket.io)
46. Компонент `SearchGlobal` — поиск по всем разделам
47. Уведомления (Notification модель + Socket.io push)
48. Тестирование всех ролей и прав доступа
49. Seed скрипт с тестовыми данными
50. Финальная сборка Docker, проверка на VPS

---

## 10. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (.env.example)

```env
# Database
DATABASE_URL=postgresql://maket:CHANGEME@localhost:5432/maketcrm
DB_PASSWORD=CHANGEME

# Auth
NEXTAUTH_SECRET=CHANGEME_RANDOM_STRING
NEXTAUTH_URL=https://crm.maketdecor.ru

# Redis
REDIS_URL=redis://localhost:6379

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# Email (для модуля Почта)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=info@maketdecor.ru
SMTP_PASS=CHANGEME

# App
NODE_ENV=production
```

---

## 11. КОМАНДЫ ДЕПЛОЯ

```bash
# Первый запуск на VPS
git clone <repo> /opt/maket-crm
cd /opt/maket-crm
cp .env.example .env
nano .env  # заполнить реальные значения

docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed

# Обновление
cd /opt/maket-crm
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy

# Бэкап БД
docker compose exec postgres pg_dump -U maket maketcrm > backup_$(date +%Y%m%d).sql
```

---

## 12. КРИТИЧЕСКИЕ ПРАВИЛА ДЛЯ CLAUDE CODE

1. **Всегда проверять роль пользователя** в каждом API route через `getServerSession` + `permissions.ts`
2. **Менеджер видит только свои данные** — ВСЕГДА добавлять `where: { managerId: session.user.id }` для роли MANAGER
3. **Производство не видит закрытые месяцы** — фильтровать по `UserSettings.openMonths`
4. **Логировать ВСЕ мутации** через `logger.ts` — без исключений
5. **Файлы хранить в `/app/uploads/`** с поддиректориями, НЕ в БД
6. **Имена файлов**: `{cuid}_{originalname}` для уникальности
7. **Все таблицы с DataTable** — сортировка, фильтрация, пагинация
8. **Цветные статусы** — использовать `StatusBadge` компонент с маппингом цветов
9. **Тёмная тема** — через Tailwind `dark:` классы + `next-themes`
10. **Все тексты интерфейса на русском языке**
