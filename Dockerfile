FROM node:22-alpine

WORKDIR /app

# Dependencias para build/produccion.
COPY package*.json ./
RUN npm ci

# Codigo fuente de la app.
COPY . .

# Prisma 7 usa prisma.config.ts y requiere DATABASE_URL durante generate.
# En runtime Railway inyecta DATABASE_URL y sobreescribe este fallback.
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/perulytics?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Arranque de produccion (Railway).
CMD ["npm", "run", "railway:start"]
