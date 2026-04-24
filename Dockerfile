FROM node:22-alpine

WORKDIR /app

# Dependencias para desarrollo.
COPY package*.json ./
RUN npm ci

# Codigo fuente de la app.
COPY . .

# Prisma 7 usa prisma.config.ts y requiere DATABASE_URL para resolver config.
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/perulytics?schema=public
RUN npx prisma generate

EXPOSE 3000

# Arranque por defecto en modo desarrollo.
CMD ["sh", "-c", "npx prisma db push && npm run start:dev"]
