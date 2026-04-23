# Perulytics (backend)

Backend en NestJS para **ingestar resultados electorales desde la presentación web de ONPE**, persistir **snapshots históricos** en PostgreSQL y exponer una **API REST** orientada a dashboards y tablas comparativas.

> Convenciones de arquitectura y dominio: ver `docs/PROJECT_RULES.md`.

## Requisitos

- **Node.js 20+** (recomendado 20 LTS)
- **PostgreSQL 16+** (local, Docker o gestionado)
- **Docker + Docker Compose** (opcional, recomendado para onboarding rápido)

## Variables de entorno

Copia `.env.example` a `.env` y ajusta valores.

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Prisma 7). En Docker Compose el host suele ser `db`. |
| `PORT` | Puerto HTTP del API (default `3000`). |
| `ONPE_ELECTION_ID` | `idEleccion` usado por ONPE (ej. `10`). |
| `ONPE_TIPO_FILTRO` | Filtro ONPE (ej. `eleccion`). |
| `ONPE_COOKIE` | Cookie opcional si ONPE bloquea requests server-to-server. |
| `ONPE_COOKIE_BASE64` | Alternativa recomendada: cookie en Base64 (evita problemas con `$` y `;` en `.env`). |

### Notas importantes sobre `DATABASE_URL`

- **En tu máquina (sin Docker)**: normalmente `localhost`.
- **Dentro de Docker Compose (servicio `api`)**: el host debe ser `db` (nombre del servicio), no `localhost`.

### Notas importantes sobre ONPE

La fuente no es una API pública documentada; el sistema consume endpoints que la web usa. En algunos entornos ONPE puede responder HTML (anti-bot). Si ocurre:

1. Copia cookies válidas desde el navegador.
2. Prefiere `ONPE_COOKIE_BASE64` para evitar corrupción de caracteres especiales en variables de entorno.

## Contrato de respuesta HTTP

En endpoints “propios” del proyecto, la respuesta exitosa sigue este formato:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errores de validación o excepciones no controladas pueden responder con el formato estándar de Nest (`statusCode`, `message`, etc.).

## API disponible

Base URL local típica: `http://localhost:3000`

### `GET /`

Healthcheck.

```bash
curl -sS http://localhost:3000/
```

### `POST /ingestion/run`

Ejecuta ingesta: descarga **totales + participantes**, crea snapshot si cambió el timestamp ONPE, upsert de candidatos e inserta resultados.

```bash
curl -sS -X POST http://localhost:3000/ingestion/run
```

**Respuesta `data` (casos frecuentes)**

- Snapshot creado:

```json
{
  "created": true,
  "snapshotId": "uuid",
  "participants": 36,
  "timestamp": "2026-04-23T...",
  "runId": "uuid"
}
```

- Sin cambios (timestamp repetido):

```json
{
  "created": false,
  "reason": "duplicate_timestamp",
  "timestamp": "2026-04-23T...",
  "runId": "uuid"
}
```

### `GET /ingestion/status`

Estado operativo: última corrida registrada (`ingestion_runs`) + resumen del último snapshot.

```bash
curl -sS http://localhost:3000/ingestion/status
```

### `GET /analytics/results`

Tabla de resultados del **último snapshot** con comparativo contra el **snapshot anterior** (deltas de votos y porcentaje).

```bash
# Todos los candidatos
curl -sS "http://localhost:3000/analytics/results"

# Filtrar por códigos de agrupación política
curl -sS "http://localhost:3000/analytics/results?codigos=8,10,35"
```

**Forma de `data`**

- `currentSnapshotTimestamp`, `previousSnapshotTimestamp`
- `results[]` con:
  - `totalVotosValidos`, `porcentajeVotosValidos`, `porcentajeVotosEmitidos`
  - `comparativoAnterior`:
    - `totalVotosValidos`, `porcentajeVotosValidos` del snapshot anterior (si no existe, se asume `0`)
    - `deltaVotosValidos`, `deltaPorcentajeVotosValidos`

### `GET /analytics/trends`

Serie temporal para un candidato.

```bash
curl -sS "http://localhost:3000/analytics/trends?codigoAgrupacionPolitica=8&limit=120"
```

## Despliegue local (recomendado para probar rápido)

### Opción 1: Docker Compose (API + Postgres)

Desde la raíz del repo:

```bash
docker compose up --build -d
docker compose logs -f api
```

- API: `http://localhost:3000`
- Postgres expuesto en host: `localhost:5432` (usuario/clave/db según `docker-compose.yml`)

Detener:

```bash
docker compose down
```

### Opción 2: Docker Compose en modo desarrollo (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Conectar a Postgres desde el host (TablePlus / DBeaver)

Usa host `127.0.0.1`, puerto `5432`, DB `perulytics`, usuario `postgres`, password `postgres` (según compose por defecto).

> Si tu `.env` usa `DATABASE_URL` con host `db`, eso es correcto **solo dentro de la red Docker**. Desde tu laptop usa `localhost`.

## Despliegue local sin Docker (para debugging)

1. Instala dependencias:

```bash
npm install
```

2. Asegura Postgres arriba y exporta `DATABASE_URL` (o usa `.env`).

3. Genera Prisma Client y sincroniza schema:

```bash
npx prisma generate
npx prisma db push
```

4. Ejecuta API:

```bash
npm run start:dev
```

## Prisma (migraciones vs db push)

Este repo incluye `prisma.config.ts` (Prisma 7). En Docker, el arranque intenta aplicar migraciones y luego sincroniza schema según el `Dockerfile`.

Para entornos compartidos, lo ideal a mediano plazo es adoptar migraciones versionadas (`prisma migrate`) y evitar depender de `db push` en producción.

## Tests

```bash
npm test
```

## Estructura relevante

- `src/controllers/*`: rutas HTTP
- `src/services/*`: lógica de negocio / orquestación
- `src/repositories/*`: acceso a datos (Prisma)
- `prisma/schema.prisma`: modelos

## Licencia

Este repositorio conserva la licencia indicada en `package.json` (según el template inicial). Ajusta licencia y metadatos si el proyecto pasa a open source/producto propio.
