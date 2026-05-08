#!/bin/bash
set -e

cd /home/deploy/crm_maket_decor

echo "[1/5] git pull..."
git pull

echo "[2/5] npm ci + build (incremental)..."
# node:20 (Debian) — не нужны apk-пакеты, npm/node уже есть
# crm_npm_cache  — кеш пакетов, сохраняется между деплоями
# crm_next_cache — кеш компиляции Next.js, сохраняется между деплоями
docker run --rm \
  -v "$(pwd):/app" \
  -v "crm_npm_cache:/root/.npm" \
  -v "crm_next_cache:/app/.next/cache" \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -w /app \
  node:20 \
  bash -c "npm ci --legacy-peer-deps && npx prisma generate && npm run build"

echo "[3/5] docker compose build..."
docker compose build app worker

echo "[4/5] deploy..."
docker compose up -d --force-recreate app worker nginx

echo "[5/5] migrate..."
docker compose exec -T app npx prisma migrate deploy

echo "✅ Done!"
