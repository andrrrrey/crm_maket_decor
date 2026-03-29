# CRM Maket Decor

Система управления студией декора мероприятий. Покрывает полный цикл работы: от первого обращения клиента до завершения проекта — с учётом воронки продаж, производственных задач, склада, дизайна и аналитики.

---

## Содержание

- [Обзор системы](#обзор-системы)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Настройка окружения](#настройка-окружения)
- [Развёртывание](#развёртывание)
- [Структура проекта](#структура-проекта)
- [Роли и права доступа](#роли-и-права-доступа)
- [Инструкции по ролям](#инструкции-по-ролям)
  - [Руководитель](#инструкция-руководитель)
  - [Менеджер](#инструкция-менеджер)
  - [Производство](#инструкция-производство)
  - [Дизайнер](#инструкция-дизайнер)
- [API-справочник](#api-справочник)
- [База данных](#база-данных)
- [Реальное время (Socket.io)](#реальное-время-socketio)
- [Фоновые задачи (BullMQ)](#фоновые-задачи-bullmq)
- [Безопасность](#безопасность)

---

## Обзор системы

**Maket Decor CRM** — корпоративная система для студии декора мероприятий (свадьбы, корпоративы, дни рождения и др.). Автоматизирует:

- Воронку продаж: входящие заявки → встречи → обсуждение → смета → договор
- Управление проектами и производственными задачами
- Контроль склада: инвентарь и ткани
- Работу дизайнеров: макеты, статусы согласования
- Финансы: договоры, счета, расходы
- Командные коммуникации: чат в реальном времени, уведомления
- Аналитику и отчёты по менеджерам и периодам

**4 роли пользователей**: Руководитель, Менеджер, Производство, Дизайнер — с жёстким разграничением доступа.

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 14 (App Router) + React 18 |
| Язык | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Таблицы | TanStack React Table |
| Формы | React Hook Form + Zod |
| Графики | Recharts |
| ORM | Prisma 5 |
| База данных | PostgreSQL 16 |
| Аутентификация | NextAuth 5 (JWT, Credentials) |
| Кэш / Очереди | Redis 7 + BullMQ |
| WebSocket | Socket.io 4.7 |
| Email | Nodemailer (SMTP + IMAP) |
| Контейнеризация | Docker + Docker Compose |
| Reverse proxy | Nginx + SSL |

---

## Архитектура

```
                        ┌──────────────┐
                        │    NGINX     │
                        │  (80 / 443)  │
                        └──────┬───────┘
                               │
                    ┌──────────▼──────────┐
                    │    Next.js App      │
                    │  + Socket.io Server │
                    │      :3000          │
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────▼──┐ ┌─▼──────────────┐
              │  PostgreSQL   │ │   Redis          │
              │   :5432       │ │   :6379          │
              └───────────────┘ └─────────┬────────┘
                                          │
                              ┌───────────▼────────┐
                              │  BullMQ Worker     │
                              │ (email + уведомл.) │
                              └────────────────────┘
```

**Компоненты:**
- **Next.js App** — фронтенд + API Routes
- **Custom server (server.js)** — интегрирует Socket.io с Next.js
- **worker.js** — фоновый процесс: очереди email, уведомлений, polling IMAP
- **PostgreSQL** — основное хранилище данных
- **Redis** — кэш, адаптер Socket.io, хранилище очередей BullMQ
- **Nginx** — SSL-терминация, проксирование

---

## Быстрый старт

### Требования

- Docker 24+
- Docker Compose 2.20+
- Домен с SSL-сертификатом (или `localhost` для разработки)

### Запуск за 5 шагов

```bash
# 1. Клонировать репозиторий
git clone https://github.com/andrrrrey/crm_maket_decor.git
cd crm_maket_decor

# 2. Создать файл окружения
cp .env.example .env
# Отредактировать .env — заполнить пароли, секреты, SMTP

# 3. Запустить контейнеры
docker compose up -d

# 4. Применить миграции и создать начальные данные
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed

# 5. Открыть браузер
# http://localhost (или ваш домен)
```

После сидинга создаётся учётная запись администратора. Логин и пароль по умолчанию указаны в `prisma/seed.ts`.

---

## Настройка окружения

Создайте `.env` на основе `.env.example`:

```env
# База данных
DATABASE_URL=postgresql://maket:STRONG_PASSWORD@postgres:5432/maketcrm

# NextAuth — обязательно сменить в продакшене
NEXTAUTH_SECRET=your_random_32_char_secret_here
NEXTAUTH_URL=https://crm.yourdomain.ru

# Redis
REDIS_URL=redis://redis:6379

# Email (SMTP — отправка)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=info@yourdomain.ru
SMTP_PASS=your_email_password

# Email (IMAP — приём заявок с сайта)
IMAP_HOST=imap.yandex.ru
IMAP_USER=info@yourdomain.ru
IMAP_PASS=your_email_password

# Лимит файлов (байт), 50 МБ по умолчанию
MAX_FILE_SIZE=52428800
```

> **Важно**: `NEXTAUTH_SECRET` должен быть случайной строкой длиной 32+ символа. Сгенерировать: `openssl rand -base64 32`

---

## Развёртывание

### Production (Docker Compose)

```bash
# Поднять все сервисы
docker compose up -d

# Посмотреть логи
docker compose logs -f app
docker compose logs -f worker

# Остановить
docker compose down

# Обновить до новой версии
git pull
docker compose build app worker
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

### Nginx SSL

Конфигурация находится в `nginx/nginx.conf`. Для SSL используйте Let's Encrypt:

```bash
certbot --nginx -d crm.yourdomain.ru
```

### Резервное копирование

```bash
# Дамп базы данных
docker compose exec postgres pg_dump -U maket maketcrm > backup_$(date +%Y%m%d).sql

# Восстановление
docker compose exec -T postgres psql -U maket maketcrm < backup_20260101.sql

# Файлы (uploads) — копировать директорию ./uploads/
```

### Управление пользователями

Пользователи создаются только через интерфейс руководителя (раздел «Пользователи»). Сброс пароля — через тот же интерфейс.

---

## Структура проекта

```
crm_maket_decor/
├── docker-compose.yml
├── Dockerfile
├── server.js                    # Custom HTTP + Socket.io сервер
├── worker.js                    # BullMQ worker
├── nginx/
│   └── nginx.conf
├── prisma/
│   ├── schema.prisma            # Схема БД
│   ├── migrations/              # SQL-миграции
│   └── seed.ts                  # Начальные данные
├── public/
│   └── wallpapers/              # 15 фоновых изображений
├── uploads/                     # Загружаемые файлы (Docker volume)
│   ├── estimates/               # Сметы (Excel)
│   ├── contracts/               # Договоры (Word/PDF)
│   ├── invoices/                # Счета
│   ├── mockups/                 # Файлы макетов
│   ├── projects/                # Фото проектов
│   └── inventory/               # Фото инвентаря
└── src/
    ├── app/
    │   ├── login/               # Страница входа
    │   ├── (dashboard)/         # Защищённые страницы
    │   │   ├── layout.tsx       # Боковое меню + шапка
    │   │   ├── dashboard/       # Главная
    │   │   ├── clients/         # Клиенты (воронка)
    │   │   ├── contracts/       # Договоры
    │   │   ├── projects/        # Проекты
    │   │   ├── calendar/        # Календарь
    │   │   ├── designer/        # Макеты дизайнера
    │   │   ├── inventory/       # Склад — инвентарь
    │   │   ├── fabrics/         # Склад — ткани
    │   │   ├── staff/           # Персонал
    │   │   ├── contractors/     # Подрядчики
    │   │   ├── mail/            # Входящие с сайта
    │   │   ├── stats/           # Аналитика
    │   │   ├── history/         # История изменений
    │   │   ├── messages/        # Общий чат
    │   │   └── settings/        # Настройки (руководитель)
    │   └── api/                 # REST API (34 роута)
    ├── components/              # UI-компоненты
    ├── lib/                     # Утилиты, auth, permissions, prisma
    ├── hooks/                   # React хуки (socket, notifications)
    └── types/                   # TypeScript типы
```

---

## Роли и права доступа

| Раздел | Руководитель | Менеджер | Производство | Дизайнер |
|--------|:-----------:|:--------:|:------------:|:--------:|
| Дашборд | ✅ | ✅ | ✅ | ✅ |
| Клиенты | ✅ все | ✅ свои | ❌ | ❌ |
| Договоры | ✅ все | ✅ свои | ❌ | ❌ |
| Проекты | ✅ все | ✅ свои | ✅ открытые месяцы | ❌ |
| Календарь | ✅ все | ✅ свои | ✅ открытые месяцы | ❌ |
| Дизайнер | ✅ все | ✅ (просмотр) | ❌ | ✅ свои |
| Склад | ✅ | ❌ | ✅ | ❌ |
| Ткани | ✅ | ❌ | ✅ | ❌ |
| Персонал | ✅ / по флагу | ❌ / по флагу | ❌ | ❌ |
| Подрядчики | ✅ / по флагу | ❌ / по флагу | ❌ | ❌ |
| Входящие | ✅ | ✅ | ❌ | ❌ |
| Статистика | ✅ | ✅ свои | ❌ | ❌ |
| История | ✅ все | ✅ свои | ✅ свои | ✅ свои |
| Сообщения | ✅ | ✅ | ✅ | ✅ |
| Настройки | ✅ | ❌ | ❌ | ❌ |

**Ключевые ограничения:**
- Менеджеры видят только своих клиентов, договоры и проекты
- Производство видит проекты только в месяцах, открытых руководителем
- Доступ к разделам «Персонал» и «Подрядчики» выдаётся руководителем через флаг `hasInfoAccess`
- Все изменения записываются в журнал истории

---

## Инструкции по ролям

Подробные руководства для каждой роли находятся в отдельных файлах:

- [docs/guide-director.md](docs/guide-director.md) — Руководитель
- [docs/guide-manager.md](docs/guide-manager.md) — Менеджер
- [docs/guide-production.md](docs/guide-production.md) — Производство
- [docs/guide-designer.md](docs/guide-designer.md) — Дизайнер

---

## API-справочник

Все эндпоинты защищены JWT-аутентификацией. Роль проверяется на уровне каждого роута.

### Аутентификация
| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/auth/[...nextauth]` | Вход / выход |

### Клиенты
| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/clients` | Список клиентов |
| POST | `/api/clients` | Создать клиента |
| GET | `/api/clients/[id]` | Данные клиента |
| PUT | `/api/clients/[id]` | Обновить клиента |
| DELETE | `/api/clients/[id]` | Удалить клиента |
| POST | `/api/clients/[id]/convert` | Конвертировать в договор |
| POST | `/api/clients/[id]/reject` | Отклонить заявку |
| GET/POST | `/api/clients/[id]/files` | Файлы смет |

### Договоры
| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/contracts` | Список договоров |
| POST | `/api/contracts` | Создать договор |
| GET/PUT/DELETE | `/api/contracts/[id]` | CRUD договора |
| GET/POST | `/api/contracts/[id]/files` | Файлы договора |

### Проекты
| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/projects` | Список проектов |
| POST | `/api/projects` | Создать проект |
| GET/PUT/DELETE | `/api/projects/[id]` | CRUD проекта |
| GET/POST | `/api/projects/[id]/tasks` | Производственные задачи |
| GET/POST | `/api/projects/[id]/purchases` | Список закупок |
| GET/POST | `/api/projects/[id]/chat` | Чат проекта |

### Дизайн
| Метод | Путь | Описание |
|-------|------|---------|
| GET/POST | `/api/designer` | Макеты |
| GET/PUT/DELETE | `/api/designer/[id]` | CRUD макета |

### Склад
| Метод | Путь | Описание |
|-------|------|---------|
| GET/POST | `/api/inventory` | Инвентарь |
| GET/POST | `/api/inventory/categories` | Категории |
| GET/POST | `/api/inventory/fabrics` | Ткани |

### Персонал и подрядчики
| Метод | Путь | Описание |
|-------|------|---------|
| GET/POST | `/api/staff` | Персонал |
| GET/POST | `/api/contractors` | Подрядчики |

### Прочее
| Метод | Путь | Описание |
|-------|------|---------|
| GET/POST | `/api/manager/tasks` | Личные задачи менеджера |
| GET/POST | `/api/manager/expenses` | Расходы |
| GET | `/api/calendar` | Данные календаря |
| GET | `/api/mail` | Входящие заявки |
| GET | `/api/stats` | Аналитика |
| GET | `/api/history` | Журнал изменений |
| GET/POST | `/api/messages` | Общий чат |
| GET/POST | `/api/notifications` | Уведомления |
| GET | `/api/search` | Поиск |
| POST | `/api/upload` | Загрузка файлов |
| GET/POST | `/api/users` | Пользователи (руководитель) |
| PUT | `/api/settings/open-months` | Открытые месяцы |

---

## База данных

### Основные модели

```
User (роль: DIRECTOR | MANAGER | PRODUCTION | DESIGNER)
├── UserSettings (openMonths: JSON, hasInfoAccess: bool)
│
├── Client (воронка продаж)
│   ├── статус: MEETING → DISCUSSION → ESTIMATE → CONTRACT → REJECTED
│   └── EstimateFile (версии смет)
│
├── Contract (договор)
│   ├── MockupStatus: PENDING → APPROVED → IN_PROGRESS → TRANSFERRED
│   ├── ContractFile (договор + счёт)
│   └── MockupImage (референсы)
│
├── Project (производственный проект)
│   ├── ProjectTask (задачи)
│   ├── ProjectPurchase (закупки)
│   ├── ProjectMessage (чат)
│   └── ProjectImage (фото)
│
├── Mockup (макет дизайнера)
│   └── MockupImageFile (зоны: церемония, президиум и др.)
│
├── InventoryCategory (дерево категорий)
│   └── InventoryItem
│       └── InventoryDamage (журнал повреждений)
│
├── Fabric (учёт тканей)
├── Staff (персонал: ядро, фрилансеры, водители)
├── Contractor (поставщики по категориям)
├── ManagerTask (личные задачи)
├── Expense (расходы)
├── MailEntry (входящие заявки)
├── Message (общий чат)
├── HistoryEntry (журнал аудита)
└── Notification (уведомления)
```

### Миграции

```bash
# Создать новую миграцию после изменения schema.prisma
docker compose exec app npx prisma migrate dev --name describe_change

# Применить миграции (production)
docker compose exec app npx prisma migrate deploy

# Открыть Prisma Studio (визуальный просмотр БД)
docker compose exec app npx prisma studio
```

---

## Реальное время (Socket.io)

**Каналы событий:**

| Событие | Описание |
|---------|---------|
| `general:join` | Подключиться к общему чату |
| `general:message` | Отправить / получить сообщение |
| `project:join` | Войти в чат проекта |
| `project:leave` | Выйти из чата проекта |
| `notification:new` | Получить новое уведомление |
| `notification:read` | Пометить уведомление как прочитанное |

Для масштабирования на несколько инстансов используется Redis Pub/Sub адаптер.

---

## Фоновые задачи (BullMQ)

**worker.js** обрабатывает три очереди:

| Очередь | Описание |
|---------|---------|
| `email` | Отправка email через SMTP (Yandex) |
| `notification` | Создание уведомлений в БД + доставка через Socket.io |
| `mailCheck` | Периодический опрос IMAP, парсинг входящих заявок |

---

## Безопасность

- **Пароли**: хранятся как bcrypt-хэши (saltRounds=10)
- **Сессии**: JWT с истечением через 30 дней, подписаны `NEXTAUTH_SECRET`
- **Маршруты**: `middleware.ts` блокирует все `/dashboard/*` без активной сессии
- **Авторизация**: роль проверяется в каждом API-роуте перед выполнением
- **Изоляция данных**: менеджеры видят только свои записи (фильтр по `userId`)
- **Загрузка файлов**: ограничение размера, проверка типов
- **Аудит**: каждое изменение данных пишется в `HistoryEntry`
- **HTTPS**: SSL-терминация на Nginx

---

## Лицензия

Проприетарное программное обеспечение. Все права защищены.
