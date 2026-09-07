# Manaseek API

Backend for the Manaseek hajj & umrah companion platform.

A modular monolith: one deployable, one Postgres database, hard module
boundaries so two engineers can work in parallel without colliding.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 24, TypeScript, NestJS |
| Database | PostgreSQL via Prisma |
| Cache / rate limiting | Redis |
| Validation | Zod (per-route pipe) |
| API contract | Swagger / OpenAPI at `/api/docs` |
| Auth | Phone OTP, JWT access token + rotating refresh token |
| Push / messaging | Pluggable providers (FCM, Fonnte WhatsApp), no-op in development |

Geospatial search runs on plain Postgres: a bounding box prefilter on the
`(latitude, longitude)` index followed by an exact haversine distance. No
PostGIS extension is required, which keeps managed-Postgres options open.

## Getting started

```bash
cp .env.example .env                 # then fill in the secrets
openssl rand -hex 32                 # -> JWT_ACCESS_SECRET
npm install
docker compose up -d                 # Postgres on 5433, Redis on 6380
npm run db:deploy                    # apply migrations
npm run db:seed                      # admin, three verified mutawif, sample booking
npm run dev
```

| | |
| --- | --- |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |
| Readiness | http://localhost:3000/api/health/ready |

Local ports are 5433/6380 on purpose, so the containers do not fight a
Postgres or Redis already installed on the host.

### Logging in without an SMS provider

With `SMS_PROVIDER=noop` the code is written to the server log, and
`POST /api/auth/otp/request` also returns it as `devCode` in development.
Setting `OTP_DEV_BYPASS_CODE` makes that fixed code valid for every number,
which is what the seeded accounts expect. The config validator refuses to
start with that variable set while `NODE_ENV=production`.

Seeded accounts:

| Phone | Role |
| --- | --- |
| `+6281200000099` | admin |
| `+966500000001` `+966500000002` `+966500000003` | verified mutawif |
| `+6281234567890` | jamaah |

## Module map

Engineer A owns everything currently in the repository.

| Module | Responsibility |
| --- | --- |
| `common/` | config, Prisma, Redis, logging, error contract, guards, shared utils |
| `modules/auth` | OTP issue/verify, JWT, refresh rotation with reuse detection |
| `modules/users` | account, jamaah profile, travel documents, trips, admin user list |
| `modules/mutawif` | application, verification, rates, weekly schedule, availability, nearby search |
| `modules/booking` | quote, lifecycle state machine, conflict detection, request expiry |
| `modules/reviews` | ratings on completed bookings, aggregate recalculation |
| `modules/notifications` | templates, push/SMS providers, device tokens, history |
| `modules/audit` | append-only trail for security and money-adjacent actions |
| `modules/internal` | token-guarded task endpoints for an external scheduler |

Engineer B's modules (`content`, `sync`, `chatbot`, `media`, `admin console`)
land alongside these under `src/modules/`.

**Boundary rule:** a module never queries another module's tables. Cross-module
access goes through the owning module's exported service.

Services already exported for the other track:

```ts
MutawifService.findNearby({ latitude, longitude, radiusKm?, serviceType?, limit })
BookingService.create(jamaahId, dto)
NotificationsService.sendToUser({ userId, templateKey, vars?, data? })
AuditService.record({ actorId, action, entity, entityId?, metadata? })
```

The chatbot escalation path ("this jamaah needs a human") is
`MutawifService.findNearby` followed by `BookingService.create`.

## Booking lifecycle

```
REQUESTED --accept--> ACCEPTED --start--> ONGOING --complete--> COMPLETED
    |                     |                  |
    |--reject--> REJECTED |--cancel--> CANCELLED <--cancel------|
    |--expire--> EXPIRED
    |--cancel--> CANCELLED
```

`src/modules/booking/booking.state-machine.ts` is the single source of truth
for which transitions exist and which role may trigger them. Every transition
writes a `BookingEvent`, so a booking's history is always reconstructable.

Two guards protect the invariants:

- The status update is a compare-and-swap on the previous status, so two
  concurrent accepts cannot both succeed.
- Accepting checks for an overlapping `ACCEPTED`/`ONGOING` booking, so a
  mutawif is never double-booked.

Unanswered requests expire after `BOOKING_REQUEST_TTL_MINUTES`, driven by an
in-process cron. On a serverless host set `SCHEDULER_ENABLED=false` and have
the platform scheduler call:

```
POST /api/internal/tasks/expire-bookings
x-internal-token: <INTERNAL_TASK_TOKEN>
```

## Payments

Out of scope for the MVP: bookings settle offline. `Booking.paymentStatus`
exists (`UNPAID` / `SETTLED_OFFLINE` / `WAIVED`) and admins record settlement
through `PATCH /api/bookings/:id/payment`, so adding a payment module later
needs no data migration. `User.organizationId` is reserved the same way for
the B2B partner track.

## Error contract

Every error response has the same shape:

```json
{
  "error": { "code": "BOOKING_INVALID_TRANSITION", "message": "...", "details": {} },
  "path": "/api/bookings/123/accept",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "requestId": "..."
}
```

Clients branch on `error.code`, never on `error.message`. The full list lives
in `src/common/errors/app-error.ts`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | watch mode |
| `npm run build` | compile to `dist/` |
| `npm test` | unit tests (state machine, pricing, geo, templates) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | create a migration from schema changes |
| `npm run db:deploy` | apply pending migrations |
| `npm run db:seed` | seed development data |
| `npm run db:studio` | Prisma Studio |

## Deployment

The default target is a long-running Node process: `docker build .` produces an
image that applies migrations on boot and serves on port 3000. Any container
host works.

For a serverless host, set `SCHEDULER_ENABLED=false` and wire the platform
scheduler to the internal task endpoint above; everything else runs unchanged.

Required in production: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`,
`CORS_ORIGINS`, plus provider credentials once real delivery is switched on
(`SMS_PROVIDER=fonnte` with `FONNTE_TOKEN`, `PUSH_PROVIDER=fcm` with
`FCM_PROJECT_ID` / `FCM_CLIENT_EMAIL` / `FCM_PRIVATE_KEY`).
