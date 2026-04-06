# Инструкция по установке CRM Maket Decor на VPS Ubuntu

**Домен:** `crm.arenda-decora72.ru`

---

## 1. Требования к серверу

- **ОС:** Ubuntu 22.04 / 24.04 LTS
- **RAM:** минимум 2 ГБ (рекомендуется 4 ГБ)
- **Диск:** минимум 20 ГБ SSD
- **CPU:** 2 ядра

---

## 2. Настройка DNS

У вашего регистратора домена (или в DNS-панели) создайте **A-запись**:

```
Тип: A
Имя: crm
Домен: arenda-decora72.ru
Значение: <IP-адрес вашего VPS>
TTL: 300
```

Проверить можно командой (через 5-15 минут после создания):
```bash
dig crm.arenda-decora72.ru +short
```
Должен вернуть IP вашего сервера.

---

## 3. Подготовка сервера

### 3.1 Подключение и обновление

```bash
ssh root@<IP-адрес-сервера>

# Обновление системы
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y curl git ufw
```

### 3.2 Настройка файрвола (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 3.3 Создание пользователя (рекомендуется)

```bash
adduser deploy
usermod -aG sudo deploy

# Скопировать SSH-ключ для нового пользователя
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Далее работаем от deploy
su - deploy
```

---

## 4. Установка Docker и Docker Compose

```bash
# Удалить старые версии (если есть)
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Установить Docker из официального репозитория
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавить пользователя в группу docker (чтобы не писать sudo)
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version
docker compose version
```

---

## 5. Клонирование проекта

```bash
cd /home/deploy
git clone https://github.com/andrrrrey/crm_maket_decor.git
cd crm_maket_decor
```

---

## 6. Настройка переменных окружения

```bash
cp .env.example .env
nano .env
```

Заполните `.env`:

```env
# Database — задайте надёжный пароль
DATABASE_URL=postgresql://maket:ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ@postgres:5432/maketcrm
DB_PASSWORD=ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ

# Auth — сгенерируйте случайную строку
NEXTAUTH_SECRET=ВСТАВЬТЕ_РЕЗУЛЬТАТ_КОМАНДЫ_НИЖЕ
NEXTAUTH_URL=https://crm.arenda-decora72.ru

# Redis
REDIS_URL=redis://redis:6379

# File uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=52428800

# Email (SMTP) — настройте если нужна отправка писем
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=ваш_email@yandex.ru
SMTP_PASS=пароль_приложения

# App
NODE_ENV=production
```

Генерация `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Генерация надёжного пароля БД:
```bash
openssl rand -base64 24
```

---

## 7. Получение SSL-сертификата (Let's Encrypt)

### 7.1 Установка Certbot

```bash
sudo apt install -y certbot
```

### 7.2 Получение сертификата (standalone)

Перед запуском Docker (порт 80 должен быть свободен):

```bash
sudo certbot certonly --standalone -d crm.arenda-decora72.ru --agree-tos -m ваш_email@example.com
```

### 7.3 Копирование сертификатов в проект

```bash
mkdir -p nginx/certs

sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/fullchain.pem nginx/certs/fullchain.pem
sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/privkey.pem nginx/certs/privkey.pem
sudo chown $USER:$USER nginx/certs/*.pem
chmod 600 nginx/certs/privkey.pem
```

### 7.4 Автообновление сертификатов

Создайте скрипт обновления:

```bash
cat > /home/deploy/renew-cert.sh << 'SCRIPT'
#!/bin/bash
cd /home/deploy/crm_maket_decor

# Остановить nginx чтобы освободить порт 80
docker compose stop nginx

# Обновить сертификат
sudo certbot renew --quiet

# Скопировать новые сертификаты
sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/fullchain.pem nginx/certs/fullchain.pem
sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/privkey.pem nginx/certs/privkey.pem

# Запустить nginx обратно
docker compose start nginx
SCRIPT

chmod +x /home/deploy/renew-cert.sh
```

Добавьте в cron (раз в 2 месяца):

```bash
sudo crontab -e
```

Добавить строку:
```
0 3 1 */2 * /home/deploy/renew-cert.sh >> /var/log/certbot-renew.log 2>&1
```

---

## 8. Создание директорий для данных

```bash
mkdir -p data/postgres data/redis
mkdir -p uploads/estimates uploads/contracts uploads/invoices uploads/mockups uploads/projects uploads/inventory
```

---

## 9. Сборка и запуск

### 9.1 Сборка Docker-образов

```bash
docker compose build
```

Первая сборка займёт 3-5 минут.

### 9.2 Запуск контейнеров

```bash
docker compose up -d
```

### 9.3 Проверка статуса

```bash
docker compose ps
```

Все 5 сервисов должны быть в статусе `Up`:
- `app` — приложение Next.js
- `worker` — фоновые задачи (email, уведомления)
- `postgres` — база данных
- `redis` — кеш и очереди
- `nginx` — веб-сервер с SSL

### 9.4 Применение миграций БД

```bash
docker compose exec app npx prisma migrate deploy
```

### 9.5 Заполнение начальными данными (seed)

```bash
docker compose exec app npx prisma db seed
```

Это создаст тестовых пользователей:

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | Директор |
| manager1 | manager123 | Менеджер |
| production1 | prod123 | Производство |
| designer1 | design123 | Дизайнер |

> **Важно:** Сразу после входа смените пароль администратора!

---

## 10. Проверка работоспособности

### В браузере

Откройте: `https://crm.arenda-decora72.ru`

Должна появиться страница входа. Войдите как `admin` / `admin123`.

### Проверка из терминала

```bash
# Health check
curl -s http://localhost/health

# HTTPS
curl -sI https://crm.arenda-decora72.ru
```

### Проверка логов (при проблемах)

```bash
# Все сервисы
docker compose logs -f

# Только приложение
docker compose logs -f app

# Только nginx
docker compose logs -f nginx

# Только БД
docker compose logs -f postgres
```

---

## 11. Обновление проекта

При выходе новых версий:

```bash
cd /home/deploy/crm_maket_decor

# Получить обновления
git pull origin main

# Пересобрать и перезапустить
docker compose build
docker compose up -d

# Применить новые миграции (если есть)
docker compose exec app npx prisma migrate deploy
```

---

## 12. Полезные команды

```bash
# Перезапуск всех сервисов
docker compose restart

# Остановка
docker compose down

# Остановка с удалением данных (ОСТОРОЖНО!)
docker compose down -v

# Зайти в контейнер приложения
docker compose exec app sh

# Зайти в БД
docker compose exec postgres psql -U maket -d maketcrm

# Просмотр БД через Prisma Studio (на порту 5555)
docker compose exec app npx prisma studio

# Очистка неиспользуемых Docker-образов
docker system prune -f
```

---

## 13. Бэкапы базы данных

### Создание бэкапа

```bash
docker compose exec postgres pg_dump -U maket maketcrm > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Автоматические бэкапы (cron)

```bash
mkdir -p /home/deploy/backups

cat > /home/deploy/backup-db.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR=/home/deploy/backups
cd /home/deploy/crm_maket_decor
docker compose exec -T postgres pg_dump -U maket maketcrm | gzip > $BACKUP_DIR/maketcrm_$(date +%Y%m%d_%H%M%S).sql.gz

# Удалить бэкапы старше 30 дней
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
SCRIPT

chmod +x /home/deploy/backup-db.sh
```

Добавить в cron (ежедневно в 2:00):
```bash
crontab -e
```
```
0 2 * * * /home/deploy/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### Восстановление из бэкапа

```bash
gunzip < backup_file.sql.gz | docker compose exec -T postgres psql -U maket -d maketcrm
```

---

## 14. Решение частых проблем

### Сайт не открывается

1. Проверьте DNS: `dig crm.arenda-decora72.ru`
2. Проверьте файрвол: `sudo ufw status`
3. Проверьте контейнеры: `docker compose ps`
4. Проверьте логи: `docker compose logs nginx`

### Ошибка сертификата SSL

1. Проверьте наличие файлов: `ls -la nginx/certs/`
2. Проверьте срок: `openssl x509 -in nginx/certs/fullchain.pem -noout -dates`
3. Перевыпустите: запустите скрипт `renew-cert.sh`

### Ошибка подключения к БД

1. Проверьте postgres: `docker compose logs postgres`
2. Проверьте пароль в `.env` — `DB_PASSWORD` должен совпадать
3. Дождитесь healthcheck: `docker compose ps` — postgres должен быть `healthy`

### Нет места на диске

```bash
# Проверить место
df -h

# Очистить Docker
docker system prune -a -f

# Проверить размер бэкапов
du -sh /home/deploy/backups/
```

---

## Краткая шпаргалка (Quick Start)

```bash
# 1. Подготовка сервера
apt update && apt upgrade -y
# Установить Docker (см. раздел 4)

# 2. Клонирование
git clone https://github.com/andrrrrey/crm_maket_decor.git
cd crm_maket_decor

# 3. Настройка
cp .env.example .env
nano .env  # заполнить пароли и секреты

# 4. SSL-сертификат
sudo certbot certonly --standalone -d crm.arenda-decora72.ru
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/crm.arenda-decora72.ru/privkey.pem nginx/certs/

# 5. Запуск
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed

# 6. Готово! Откройте https://crm.arenda-decora72.ru
```
