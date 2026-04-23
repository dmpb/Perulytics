# PROJECT_RULES.md (Backend Only)

---

# 🎯 Project Overview

Perulytics backend es un sistema encargado de:

* consumir datos públicos de la ONPE
* almacenar snapshots históricos
* procesar resultados electorales
* exponer métricas como ranking, tendencias y momentum mediante una API

El sistema está diseñado para trabajar con datos en tiempo real y soportar análisis temporal.

---

# 🏗️ Architecture Type

**Modular Monolith (API + Ingestion)**

* API REST para consumo de frontend
* Servicio de ingesta independiente (cron job interno)

Justificación:
Se requiere simplicidad en el MVP, pero con separación clara de responsabilidades.

---

# 🧩 Tech Stack

## Backend

* Node.js
* Express
* Prisma ORM

## Database

* PostgreSQL

## Environment

* Railway (deploy + cron)
* Neon (PostgreSQL)

---

# 🧱 Architecture Rules (STRICT)

Arquitectura en capas obligatoria:

```id="5p2k1s"
Controllers → Services → Repositories → Models
```

---

## Responsibilities per layer

### Controllers

* Manejan HTTP requests
* Validan inputs básicos
* Llaman a Services
* No contienen lógica de negocio

---

### Services

* Contienen lógica de negocio
* Calculan:

  * top 3 candidatos
  * diferencias entre candidatos
  * momentum
  * tendencias
* Orquestan repositorios

---

### Repositories

* Acceso a datos con Prisma
* Encapsulan queries
* No contienen lógica de negocio

---

### Models

* Definidos en Prisma schema
* Representan entidades del dominio

---

# 📁 Project Structure Rules

```id="s1i9vl"
src/
 ├── modules/
 │    ├── election/
 │    ├── candidate/
 │    ├── result/
 │
 ├── services/
 │    ├── ingestion/
 │    ├── analytics/
 │
 ├── repositories/
 ├── controllers/
 ├── jobs/
 ├── utils/
```

---

# ⚙️ Framework Rules (Express)

* Cada módulo tiene su controller
* Rutas organizadas por dominio

Formato de respuesta estándar:

```json id="0u9wpf"
{
  "success": true,
  "data": {},
  "error": null
}
```

---

# 🔐 Authentication Rules

No aplica en MVP.

API pública.

---

# 🔒 Authorization Rules

No aplica en MVP.

---

# 🌍 Environment Rules (CRITICAL)

* Uso obligatorio de `.env`
* No hardcodear credenciales
* Variables típicas:

```env id="5rmvha"
DATABASE_URL=
PORT=
ONPE_ELECTION_ID=
```

---

# 🗄️ Database Rules (CRITICAL)

* UUID como primary key en todas las tablas
* snake_case en nombres
* Uso obligatorio de foreign keys

### Índices obligatorios:

* snapshot_id
* candidate_id
* election_id
* timestamp

---

# 🧩 Core Entities

* Election
* Snapshot
* Candidate
* CandidateResult

---

# 🔄 Ingestion Rules (CRITICAL)

* Frecuencia: cada 1–2 minutos
* Fuente: APIs públicas ONPE
* Cada ejecución debe:

  1. Obtener participantes
  2. Obtener totales
  3. Crear snapshot
  4. Upsert candidatos
  5. Insertar resultados

---

## Anti-duplicación

* No crear snapshot si timestamp es igual al último

---

# 📊 Business Logic Rules

## Top 3

* Ordenar por porcentajeVotosValidos DESC
* Limitar a 3

---

## Momentum

```text id="x9d9h9"
momentum = porcentaje_actual - porcentaje_anterior
```

---

## Diferencia crítica

```text id="c3o9qz"
diferencia = candidato_2 - candidato_3
```

---

## Tendencias

* Basadas en snapshots históricos
* Ordenadas por timestamp

---

# ❗ Error Handling

* Manejo centralizado
* No exponer errores internos
* Logs para debugging

---

# 🏷️ Naming Conventions

* camelCase → variables
* PascalCase → clases
* snake_case → DB
* kebab-case → endpoints

---

# ⚡ Performance Guidelines

* Evitar N+1 queries
* Usar includes/select en Prisma
* Limitar resultados innecesarios

---

# 🧪 Testing Strategy

Tests unitarios para:

* cálculo de top 3
* cálculo de momentum
* lógica de tendencias

---

# 📜 Logging

* Loggear:

  * ejecución de ingesta
  * errores
* No loggear datos sensibles

---

# ⚙️ Configuration Management

* `.env` obligatorio
* separar dev / prod

---

# 🧑‍💻 Development Rules

* Código simple y legible
* Evitar duplicación
* Respetar capas

---

# 🔄 Evolution Rule

* Extender código existente
* No romper estructura

---

# 🤖 AI Behavior Rules (CRITICAL)

* Seguir estrictamente este archivo
* No introducir nuevas arquitecturas
* No duplicar lógica
* Respetar separación de capas

---

# 🚀 Development Strategy

## Phase 1

* Ingesta ONPE
* Persistencia de snapshots

## Phase 2

* API:

  * /top3
  * /trends

## Phase 3

* Métricas avanzadas:

  * momentum
  * diferencias

---

# ⚠️ Constraints

* MVP first
* No overengineering
* Priorizar funcionalidad

---

# 🧠 Mindset

* Pensar como sistema de datos
* Priorizar consistencia
* Diseñar para análisis temporal
