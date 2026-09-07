# Manaseek API

Backend for the Manaseek hajj & umrah companion platform.

A modular monolith: one deployable, one Postgres database, hard module
boundaries so two engineers can work in parallel without colliding.

## Stack

- Node.js 24+ / TypeScript / NestJS
- PostgreSQL via Prisma
- Redis for rate limiting and short-lived state
- Zod for request validation
- Swagger (OpenAPI) as the shared API contract

## Getting started

```bash
cp .env.example .env      # then fill in the secrets
npm install
docker compose up -d      # local Postgres + Redis
npm run db:migrate
npm run db:seed
npm run dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Module ownership

| Track | Modules |
| --- | --- |
| Engineer A | auth, users, mutawif, booking, reviews, notifications, audit |
| Engineer B | content, sync, chatbot, media, admin console |

Rule: a module never queries another module's tables directly. Cross-module
access goes through the exported service of the owning module.

## Error contract

Every error response has the same shape:

```json
{
  "error": { "code": "BOOKING_INVALID_TRANSITION", "message": "...", "details": [] },
  "path": "/api/bookings/123/accept",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "requestId": "..."
}
```

Clients branch on `error.code`, never on `error.message`.
