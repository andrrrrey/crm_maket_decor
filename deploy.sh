#!/bin/bash
set -e

# Load nvm / node if not in PATH
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
# Fallback: common node install paths
for p in /usr/local/bin /usr/bin ~/.local/bin; do
  [ -x "$p/npm" ] && export PATH="$p:$PATH" && break
done

cd /home/deploy/crm_maket_decor

echo "[1/6] git pull..."
git pull

echo "[2/6] npm ci..."
npm ci --legacy-peer-deps

echo "[3/6] prisma generate..."
npx prisma generate

echo "[4/6] npm run build (incremental)..."
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "[5/6] docker compose build + deploy..."
docker compose build app worker
docker compose up -d --force-recreate app worker

echo "[6/6] prisma migrate deploy..."
docker compose exec -T app npx prisma migrate deploy

echo "✅ Done!"
