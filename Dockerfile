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
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="stockflow_production_jwt_secret_key_2026"

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY server ./server
COPY tsconfig.json ./

RUN npm install tsx

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx server/index.ts"]
