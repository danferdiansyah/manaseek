# Manaseek API

Backend for the Manaseek hajj & umrah companion platform.

A modular monolith: one deployable, one Postgres database, hard module
boundaries so two engineers can work in parallel without colliding.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 24, TypeScript, NestJS |
| Database | PostgreSQL via Prisma |
| Validation | Zod (per-route pipe) |
| API contract | Swagger / OpenAPI at `/api/docs` |
| Auth | Google Sign-In, JWT access token + rotating refresh token |
| Push | Pluggable provider (FCM), no-op in development |

Geospatial search runs on plain Postgres: a bounding box prefilter on the
`(latitude, longitude)` index followed by an exact haversine distance. No
PostGIS extension is required, which keeps managed-Postgres options open.

## Getting started

```bash
cp .env.example .env                 # then fill in the secrets
openssl rand -hex 32                 # -> JWT_ACCESS_SECRET
npm install
docker compose up -d                 # Postgres on 5434
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

Port 5434 is deliberate: it keeps the container clear of a Postgres already
installed on the host, and of anything else holding the ports next to 5432.
Change the mapping in `docker-compose.yml` and `DATABASE_URL` together if it is
taken on your machine.

## Authentication

Google Sign-In is the only login method, and it is also the sign-up path: the
Google account is the identity, so there is no separate registration endpoint.

```
client runs Google Sign-In  ->  POST /api/auth/google { idToken }
                            ->  we verify the token against Google's JWKS
                            ->  we return our own accessToken + refreshToken
```

We never hold a Google client secret. The client (web, Android or iOS) obtains
the ID token; we only verify it. Each platform has its own OAuth client id and
all of them must be listed in `GOOGLE_CLIENT_IDS`, because the client id is the
`aud` claim we check. Create them under
[Google Cloud credentials](https://console.cloud.google.com/apis/credentials).

Verification checks the RS256 signature against Google's published keys, the
`aud` against our client ids, the `iss`, the expiry, and that the account's
email is verified. `src/modules/auth/google-auth.service.spec.ts` covers each
of those rejections, including a forged signature.

The phone number is now contact information only, set through
`PATCH /api/users/me`. It never authenticates anyone.

### Logging in locally without Google credentials

Set `AUTH_DEV_LOGIN=true` and post an email address:

```bash
curl -X POST http://localhost:3000/api/auth/dev-login \
  -H 'content-type: application/json' \
  -d '{"email":"ahmad@manaseek.test"}'
```

This mints a normal session for that address, creating the account if it does
not exist. The config validator refuses to start with the flag enabled while
`NODE_ENV=production`.

Seeded accounts:

| Email | Role |
| --- | --- |
| `admin@manaseek.test` | admin |
| `hasan@manaseek.test` `yusuf@manaseek.test` `maryam@manaseek.test` | verified mutawif |
| `ahmad@manaseek.test` | jamaah |

## Module map

Engineer A owns everything currently in the repository.

| Module | Responsibility |
| --- | --- |
| `common/` | config, Prisma, logging, error contract, guards, shared utils |
| `modules/auth` | Google ID token verification, JWT, refresh rotation with reuse detection |
| `modules/users` | account, jamaah profile, travel documents, trips, admin user list |
| `modules/mutawif` | application, verification, rates, weekly schedule, availability, nearby search |
| `modules/booking` | quote, lifecycle state machine, conflict detection, request expiry |
| `modules/reviews` | ratings on completed bookings, aggregate recalculation |
| `modules/notifications` | templates, push provider, device tokens, history |
| `modules/audit` | append-only trail for security and money-adjacent actions |
| `modules/content` | guidance topics, prayers, prohibitions, departure checklist |
| `modules/chat` | the assistant: curated context, guardrails, token accounting |
| `modules/internal` | token-guarded task endpoints for an external scheduler |

The content and chat modules were originally the other track's; they now live
here too. What remains unbuilt is media upload for mutawif verification
documents and an admin console.

## The assistant

`POST /api/chat/messages` answers from the guidance library and nothing else.
The whole curated library is small enough to sit in one prompt, so there is no
retrieval step and the model has nothing outside it to draw on. Three rules are
enforced rather than hoped for:

- The answer comes back as structured output with `citedSlugs` and
  `needsHuman`, so escalation is a field we branch on, not a phrase we grep.
- Any slug the model cites that is not in the library is dropped before the
  reply is stored; a citation that leads nowhere is worse than none.
- Prompt and completion tokens are stored per message, so AI spend can be
  attributed without a separate ledger.

Set `GEMINI_API_KEY` from https://aistudio.google.com/apikey. Without it the
endpoint answers 503 with a clear message instead of failing deeper in.

**The free tier allows 20 requests per day, per model.** A single demo session
can exhaust it. `GEMINI_FALLBACK_MODELS` is tried in order when the primary
model returns 429, so one exhausted model does not take the assistant down;
each model carries its own daily allowance. When every model is spent the API
answers `429 AI_QUOTA_EXCEEDED` and says so plainly, and the client still
offers the route to a human mutawif. Enabling billing on the Google Cloud
project lifts the cap.

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

The API deploys to Vercel as a single serverless function, with Supabase as the
managed Postgres. A `Dockerfile` is also kept for any container host.

### Supabase

Create a project, then take two connection strings from
**Project settings → Database**. Both come from the **pooler**, not from the
direct host:

| Variable | Which string | Why |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler, port 6543, plus `?pgbouncer=true&connection_limit=1` | Serverless opens many short-lived connections; the pooler absorbs them |
| `DIRECT_URL` | Session pooler, port 5432 | A transaction pooler cannot run DDL, so migrations need session mode |

Two things will cost you an hour each if you do not know them:

- **`sslmode=require` is mandatory on both URLs.** Without it the Prisma engine
  fails with `P1001: Can't reach database server`, while `psql` connects to the
  very same URL without complaint. The error names the wrong cause.
- **Do not use `db.<ref>.supabase.co`.** On the free plan that host resolves to
  an AAAA record only, so any IPv4 network fails to reach it. The pooler host
  has A records and works everywhere.

Only Postgres and Storage are used. Authentication stays in this service, so
leave the Supabase **Authentication** section alone.

Storage buckets: `mutawif-documents` (private, holds identity documents) and
`avatars` (public).

### Vercel

Two projects deploy from this one repository:

| Project | Root directory | Serves |
| --- | --- | --- |
| `manaseek` | repo root | the web app, and proxies `/api/*` to the API |
| `manaseek-api` | `manaseek-api` | this service |

**Setting the API project's root directory is not optional.** Left empty, a
push builds the repo root — the web app — and aliases it to
`manaseek-api.vercel.app`. The web app's `/api/*` rewrite then points at
itself and every API request dies with `INFINITE_LOOP_DETECTED`.

The web app's `vercel.json` rewrites `/api/:path*` to the API deployment, so
the browser only ever talks to one origin. That is why `CORS_ORIGINS` matters
so little in practice, why the frontend calls `/api/…` with no base URL, and
why Google needs only one authorised JavaScript origin.

Environment variables on the API project:

```
DATABASE_URL, DIRECT_URL      from Supabase, as above
JWT_ACCESS_SECRET             openssl rand -hex 32
GOOGLE_CLIENT_IDS             the OAuth client ids, comma separated
CORS_ORIGINS                  the web app origin
AUTH_DEV_LOGIN                false   (the app refuses to boot otherwise)
SCHEDULER_ENABLED             false   (see below)
INTERNAL_TASK_TOKEN           openssl rand -hex 24
CRON_SECRET                   the same value as INTERNAL_TASK_TOKEN
```

`npx prisma migrate deploy` runs as part of the build, so a deploy always
carries its schema with it. That does mean a preview deploy migrates whichever
database its environment points at — give previews their own Supabase branch if
that ever matters.

### Why the scheduler is off on Vercel

Serverless instances do not stay alive, so the in-process cron cannot be
trusted; `SCHEDULER_ENABLED=false` disables it. Vercel Cron calls
`GET /api/internal/tasks/expire-bookings` instead, authenticated with
`CRON_SECRET`, which the internal guard accepts as a bearer token.

On the Hobby plan that cron only fires once a day, which is far too slow for a
15-minute booking deadline. So expiry does not depend on it: reading a booking
also closes out any request of its own that is past its deadline. The cron is
the sweep that sends the notification, not the thing that keeps the data
honest.

### Container hosts

`docker build .` produces an image that applies migrations on boot and serves
on port 3000. Leave `SCHEDULER_ENABLED=true` there and the in-process cron
handles expiry on its own.

Required in production everywhere: `DATABASE_URL`, `DIRECT_URL`,
`JWT_ACCESS_SECRET`, `CORS_ORIGINS`, `GOOGLE_CLIENT_IDS`. Push delivery needs
`PUSH_PROVIDER=fcm` with `FCM_PROJECT_ID` / `FCM_CLIENT_EMAIL` /
`FCM_PRIVATE_KEY`; until then it stays on the no-op provider and notifications
are recorded but not delivered.
