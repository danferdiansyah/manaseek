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

## Rate limiting

Requests are counted per account, not per IP. Behind the web app's `/api/*`
rewrite the API only ever sees the proxy, so an IP-keyed limiter would put
every jamaah in one bucket and let a handful of them lock everyone out. An IP
is also spoofable through a forwarded header; a session is not.

`trust proxy` is set on both entrypoints so `req.ip` still resolves to the
caller on the anonymous auth routes.

## The assistant

### AI access policy

Every `/chat` endpoint requires both authentication and `AiAccessGuard`.
The global JWT guard loads the current account once per request; the AI guard
checks its server-derived permission and allows only active,
email-verified accounts in `src/common/access/ai-access.ts`. The seven approved
emails are matched exactly after trimming/lowercasing; aliases and ADMIN roles
do not bypass the list. Other accounts receive `403 AI_ACCESS_DENIED` before
any history operation or model call. No history is deleted by this restriction.

Login, onboarding, and `/auth/me` return `permissions.aiChat` for the current
account. This is a display hint for clients, never proof of authorization.
The mobile screen shows an access notice when permission is absent or false.
Update the server policy and redeploy to change membership; no APK rebuild or
database migration is needed for future list changes.

`npm run test:ai-access` exercises the compiled controller and real JWT guard
over local HTTP, using in-memory identities and stubbed chat operations only.
It verifies all seven accounts, denied users, admin/alias/spoof attempts,
missing/unverified/suspended accounts, and revocation with an existing token.

### User chat history

The AI Chat screen restores the account's most recently active conversation.
**Riwayat** lists saved conversations; selecting one loads its messages and
continues that same session. **Chat baru** starts a separate conversation when
the first question is sent. Existing sessions and messages remain available;
this feature uses the existing database schema and needs no new migration.

All chat routes require a bearer token. The owner comes from the authenticated
user, never from a request parameter. Reading or continuing another user's
session returns `404 NOT_FOUND`.

| Endpoint | Response |
| --- | --- |
| `GET /api/chat/sessions?page=1&limit=20` | `{ items, meta }`, sorted by latest activity; each item has `id`, `title`, `preview`, `messageCount`, `createdAt`, and `updatedAt` |
| `GET /api/chat/sessions/:id/messages?page=1&limit=50` | `{ items, meta, session }`; page 1 contains the newest messages, in chronological display order; later pages contain older messages |
| `POST /api/chat/messages` | `{ sessionId, userMessage, message }`; include `sessionId` to continue an existing conversation |
| `DELETE /api/chat/sessions/:id` | `{ deleted }`; permanently removes one owned conversation and its messages; missing or foreign IDs return `0` |
| `DELETE /api/chat/sessions` | `{ deleted }`; permanently removes all conversations belonging to the authenticated user, including unloaded pages |

The mobile history sheet confirms deletion before sending either request. The
ownership filter is applied directly in the database write; existing foreign-key
cascades remove all messages atomically. Deleting the currently open conversation
also resets the mobile composer. No database migration is needed.

To verify real persistence after `npm run build`, run
`node --env-file=.env scripts/check-chat-deletion-db.mjs`. It creates synthetic
users and chats inside a transaction that always rolls back, and checks ownership,
message cascades, delete-all, and repeated deletion without touching existing data.

Pagination limits are validated from 1 to 100. `meta` contains `page`, `limit`,
`total`, and `totalPages`. Messages retain their citations and human-escalation
flag; token accounting and model metadata stay internal.

The history GET endpoints now return paginated objects instead of bare arrays.
Questions and session activity are saved together before requesting an AI
answer. If generating or saving the answer fails after the question was saved,
`error.details` contains `sessionId` and `userMessage` so the frontend can retain
the conversation and reconcile its temporary message. History can be read
without an AI provider key or another model call.

Backend regression coverage: `src/modules/chat/chat.service.spec.ts`.
Frontend browser coverage: run `npm run test:chat-history` in `manaseek-ui`.
The browser check starts its own local Vite server and uses fixture responses;
it does not contact real accounts or invoke the AI provider.

### Answer generation

`POST /api/chat/messages` uses server-only `OPENROUTER_API_KEY` and
`OPENROUTER_MODEL` (default `xiaomi/mimo-v2.6-pro`). Never put these credentials
in an `EXPO_PUBLIC_*` variable.

Answer generation uses the following stages, with a shared 110-second deadline:

1. Classify the current question in context. Greetings, ambiguous questions,
   and off-topic requests receive fixed responses without web search.
2. For Islamic questions, retrieve web excerpts through OpenRouter's Exa web
   plugin, restricted to Kemenag, NU, MUI, Muhammadiyah, Quran.com, Sunnah.com
   and Egypt's Dar al-Ifta (`dar-alifta.org`) for additional Arabic evidence.
   Generate a structured answer with numbered references and optional prayers.
   A recitation-only request is presented as a brief introduction plus the
   requested prayer cards; unsolicited prose is removed before verification.
   Combined requests for prayers and practices retain their explanation.
3. Require reference URLs to match actual provider retrieval annotations, match
   evidence quotations against those excerpts, check Arabic wording against its
   source (ignoring diacritics, direction marks and punctuation, never words or
   gaps between excerpts), and separately review every substantive claim,
   attribution and translation against the retrieved evidence. Repeated source
   URLs are coalesced and citation numbers remapped after validating each quote.
   Typography-only quote differences are normalized. A misplaced prayer link
   can be resolved to another retrieved page only if that page contains the
   exact Arabic wording; its attribution and translation are still reviewed.
   Unused references are removed, then the canonical answer is reviewed.
4. A failed check may trigger one evidence-based rewrite and one fresh search
   (Exa deep-lite, up to eight results, with an Arabic topic query). Every new
   draft must pass the same checks; scope rejection never triggers repair.
   Transient recovery timeouts may use the remaining attempt; long Arabic
   recitations have the same generation budget as the initial response.
   The entire workflow shares the 110-second deadline. If recovery fails,
   return a verification-failure message without implying the prayer does not
   exist or routing a technical retrieval failure to a human adviser.

This checks source provenance and model-assessed support; it is not human
scholarly verification or a guarantee of correctness. The Sunni/Shafi'i default
reflects common Indonesian practice while preserving named differences and
explicit user requests for another school. Search results are untrusted data.
No unsourced or model fallback is used. A first-pass success uses one Exa search
and three model calls. Bounded recovery can use up to two searches and seven
model calls. Diagnostics record stages/counts only, never questions or drafts.

`answerDetails` is an additive nullable JSON column, version 1, storing status,
numbered references (provider titles and URLs), and Arabic/Indonesian prayer
cards with attribution. Older messages retain their original contents and are
marked in mobile as lacking the new references; they are not retroactively
labelled verified. Questions remain in history if generation fails. Token
accounting totals classification, generation, review and recovery. Provider error bodies and keys are never
included in logs or API responses. The Vercel function allows 120 seconds.

Run `npm run db:generate`, `npm test`, `npm run build`, and `npm run lint`.
Regression tests cover owner isolation, saved-question recovery, persisted
answer metadata, missing/forged sources, URL spoofing, unsupported claims,
Arabic mismatches, and classifier rejection before any search.

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

Mutawif bookings settle offline. `Booking.paymentStatus`
exists (`UNPAID` / `SETTLED_OFFLINE` / `WAIVED`) and admins record settlement
through `PATCH /api/bookings/:id/payment`, so adding a payment module later
needs no data migration. `User.organizationId` is reserved the same way for
the B2B partner track.

## Umrah packages and dummy checkout

The `umrah` module has its own inventory, order and payment tables. Every route
requires authentication. Orders and receipts are scoped to the authenticated
user; another user's receipt returns 404.

| Endpoint | Response / behavior |
| --- | --- |
| `GET /api/umrah/packages` | Active demo packages with future departures, prices, flights, hotels, itinerary and inclusions |
| `GET /api/umrah/packages/:slug` | One package with its available departure schedules |
| `POST /api/umrah/orders` | Reserve seats and persist a confirmed order, travelers and successful dummy payment atomically |
| `GET /api/umrah/orders?page=1&limit=20` | Current user's orders, newest first, `{ items, meta }` |
| `GET /api/umrah/orders/:id` | Owned receipt, travelers and immutable purchased package snapshot |

Checkout accepts `requestId` (UUID), `departureId` (UUID), `roomType`
(`QUAD`, `TRIPLE`, `DOUBLE`), `contactName`, `contactEmail`, `contactPhone`,
`travelers` (1–6 objects with `fullName`, `gender`, `birthDate` as YYYY-MM-DD),
and `acceptDemo: true`. Prices, totals, user IDs and payment status are never
accepted from the client. All ages use the same demo price per traveler.
Shared-room capacity is displayed in the UI; incomplete rooms are shared with
other travelers of the same gender, rather than charging for unused beds.

The server computes `(basePrice + roomSupplement) × travelerCount` using
Prisma Decimal, then atomically decrements available seats, creates the order
and traveler rows, and writes a `DUMMY` / `SUCCESS` payment with the same amount.
The order is `CONFIRMED` and explicitly `isDemo`. There is no Midtrans call,
money movement, airline ticket issuance, hotel reservation or external message.
Inactive, expired, non-demo and insufficient-seat departures are rejected.

`(userId, requestId)` is unique. Retries with the same payload return the saved
order; a changed payload with the same request ID returns 409. The transaction
and conditional seat update prevent partial writes and overselling, including
concurrent retries. Order snapshots preserve flight, hotel, itinerary, dates
and prices even if the catalog is subsequently changed.

Migration `20260929090000_add_umrah_packages` creates five tables and inserts
three fictional packages (9, 12 and 15 days) with nine departures from November
2026 through January 2027. It runs with `npm run db:deploy`, including the Vercel
build. Catalog data is in the migration; rerunning the general development seed
does not reset remaining seats or existing orders.

Validation with a **local** PostgreSQL database:

```bash
npm run db:deploy
npm run db:generate
npm run build
npm test
npm run test:umrah-db
```

The database checks create and remove their own fixture accounts and packages.
They verify persistence across connections, access control, price snapshots,
duplicate submissions, final-seat races, rollback and unavailable packages.
The UI's `npm run test:umrah` additionally runs a real Nest app and browser
against this database, including a response lost after payment was committed.

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
