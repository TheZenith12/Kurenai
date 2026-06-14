FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ─── Dependencies ─────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ─── Build ────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Production ───────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

USER nestjs
EXPOSE 3001
CMD ["node", "dist/main"]
