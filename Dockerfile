FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma 7 usa prisma.config.ts y requiere DATABASE_URL para resolver config.
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/perulytics?schema=public
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/perulytics?schema=public
RUN npx prisma generate

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db push && node dist/src/main.js"]
