# Multi-stage production Dockerfile for StockFlow
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY server ./server
COPY tsconfig.json ./

RUN npm install tsx

# Security hardening: switch to non-root node user before exposing ports.
# The node:20-alpine image ships with a built-in 'node' user (uid=1000).
# Running as non-root limits the blast radius if the process is exploited.
USER node

EXPOSE 3001

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma migrate deploy || true; npx tsx server/seed.ts || true; fi && npx tsx server/index.ts"]
