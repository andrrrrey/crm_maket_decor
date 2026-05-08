# syntax=docker/dockerfile:1
# No build here — app is pre-built on the host via deploy.sh
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install production deps only (cached layer — reruns only if package.json changes)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --omit=dev

# Generate Prisma client for Alpine/Linux (cached layer — reruns only if schema changes)
COPY prisma ./prisma
RUN npx prisma generate

# Copy pre-built Next.js output (this layer reruns on every deploy — ~5s)
COPY .next ./.next
COPY public ./public
COPY server.js worker.js ./

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p uploads/estimates uploads/contracts uploads/invoices \
             uploads/mockups uploads/projects uploads/inventory && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
