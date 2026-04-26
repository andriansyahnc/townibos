# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

### Think before working
Read the affected files and understand the existing pattern before writing a single line. If the task touches multiple modules, trace the call chain end-to-end first. A wrong mental model produces code that passes review but breaks in production.

### Keep CLAUDE.md current
Update this file whenever you discover a new pattern, fix a non-obvious bug, add a module, or change a toolchain detail. Future instances have no memory of this session — this file is the only durable knowledge transfer. Update the relevant section in-place; do not append stale duplicates.

Triggers that warrant an update:
- New module added to AppModule
- New env var introduced
- Bug fixed whose root cause is non-obvious
- A gotcha hit for the first time (mock shape, route order, type cast, etc.)
- Architecture decision made (e.g. choosing not to use a vector DB)

### Remove dead code
If code is no longer called — a method, import, env var, or entire file — delete it. Dead code misleads future readers and causes false positives in search. Confirm nothing calls it (grep + check all consumers) before deleting.

---

## Commands

```bash
# Development
pnpm run start:dev       # nodemon hot-reload via ts-node
pnpm run start:debug     # single run via ts-node (no watch)

# Build & production
pnpm run build           # tsc → dist/
pnpm run start           # node dist/main

# Type check (no emit)
pnpm exec tsc --noEmit

# Tests
pnpm test                # jest
```

# Lint / format (Biome)
pnpm run check          # lint + format check
pnpm run check:fix      # auto-fix lint + format

# Docker
pnpm run docker:dev     # dev stack with hot-reload (mounts ./src)
pnpm run docker:prod    # production stack (compiled image)
pnpm run docker:down    # stop and remove containers

## Architecture

Townibos is a **residential complex (perumahan) CRM** with three integrated surfaces: a REST API, a Telegram bot, and a RAG chatbot for resident queries.

### Module map

```
AppModule
 ├── AuthModule          JWT login; AdminUser in MongoDB; bcrypt passwords; roles: superadmin | admin
 ├── ResidentsModule     Penghuni CRUD; phone is the join key to Telegram identity; resident portal (magic link login + profile self-service)
 ├── UnitsModule         Hunian/unit CRUD (block, floor, type, status)
 ├── AnnouncementsModule Pengumuman; broadcastTelegram flag for future push
 ├── PaymentsModule      Tagihan iuran/listrik/air/parkir; period is 'YYYY-MM' string
 ├── RegulationsModule   Peraturan tata tertib stored in MongoDB; source docs for RAG
 ├── RagModule           Claude-backed Q&A; depends on RegulationsModule
 ├── NotionModule        Syncs Notion database → Regulation collection; triggers RAG refresh
 └── TelegramModule      Bot update handler; depends on Rag, Residents, Announcements, Payments
```

### RAG pipeline

`RagService` (not a vector DB) loads all `Regulation` documents from MongoDB into a single in-memory string on first query, then passes it as the system prompt to `claude-sonnet-4-6` with `cache_control: { type: 'ephemeral' }` for prompt caching. Call `POST /api/v1/rag/refresh` after any regulation changes to invalidate the in-memory cache.

### Notion sync

`NotionService.syncAll()` fetches all pages from each active town's Notion database, converts blocks to plain text, and upserts into `Regulation` using `notionPageId` as the key (idempotent re-sync). A fresh `Client` is created per town using its decrypted `notionApiKey`. Supported block types: paragraph, heading 1–3, bulleted/numbered list, to_do, quote, callout, toggle, divider. `callout` and `toggle` render as plain text (no prefix). The sync auto-calls `RagService.refreshContext(townId)` per town on completion. The Notion database optionally has a `Category` (or `Kategori`) select property — values are free-form strings stored as-is (lowercased); no hardcoded enum, each town defines their own categories directly in Notion. Missing category is stored as `''`. There is no global `NOTION_API_KEY` — keys are stored per town in MongoDB, encrypted at rest.

### Telegram bot

`TelegramUpdate` uses `nestjs-telegraf` decorators (`@Command`, `@On`, `@Start`). Plain text messages (non-commands) are automatically routed to `RagService.query()`. Residents link their Telegram account via `/daftar <phone>` which matches on `Resident.phone` and writes `telegramChatId`.

### Data relationships

- `Resident` → `Unit` (ObjectId ref, optional — a resident may not yet have a unit assigned)
- `Payment` → `Resident` + `Unit` (both required refs)
- `Regulation` has an `embedding: number[]` field reserved for future vector similarity; currently unused

### Resident portal (magic link)

`ResidentPortalController` (`/api/v1/residents/portal/...`) handles self-service:
- `POST /request-link` — public; finds resident by email, stores `magicToken` + `magicTokenExpiry` (15 min) on Resident doc, sends email via `EmailService`
- `GET /verify?token=` — public; validates token + expiry, `$unset`s both fields, returns resident JWT with `role: 'resident'`
- `GET /me`, `PATCH /me` — protected by `JwtAuthGuard` + `@Roles('resident')`; resident edits name/email/phone

`EmailService` logs the magic link to the console when `SMTP_HOST` is unset (dev mode). Frontend portal lives at `/portal/*` (separate from admin at `/(protected)/*`); uses `localStorage['resident_token']` separate from admin `token`. Magic token fields have `select: false` on the schema so they never appear in normal queries.

### Config

All env vars flow through `src/config/configuration.ts` and are accessed via NestJS `ConfigService` using dot-notation keys (e.g. `config.get('telegram.botToken')`). Never read `process.env` directly in modules.

### Global API prefix

All REST routes are prefixed `/api/v1` (set in `main.ts`). Example: `POST /api/v1/auth/login`.

### Multi-tenancy scoping

Every domain controller (residents, units, payments, announcements, regulations) follows this pattern:

- **Read (findAll):** pass `user.townId` when role is `admin`; pass `undefined` for `superadmin` (no filter = all towns).
- **Write (create):** override `dto.townId = user.townId` when role is `admin` — never trust the client-supplied townId.
- **Mutate (update/remove):** pass `user.townId` to the service so the query uses a compound `{ _id, townId }` filter — an admin querying another town's record gets NotFoundException (not a 403, which would leak existence).
- **Service signature:** use `findOneAndUpdate`/`findOneAndDelete` with `{ _id: id, ...(townId && { townId }) }` — never `findByIdAndUpdate`/`findByIdAndDelete` for scoped mutations.

```ts
// Controller pattern
@Get()
findAll(@CurrentUser() user: CurrentUserPayload) {
  return this.service.findAll(user.role === 'admin' ? user.townId : undefined);
}

@Post()
create(@Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
  if (user.role === 'admin') dto = { ...dto, townId: user.townId };
  return this.service.create(dto);
}

@Patch(':id')
update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: CurrentUserPayload) {
  return this.service.update(id, dto, user.role === 'admin' ? user.townId : undefined);
}

// Service pattern
async update(id: string, dto: Partial<T>, townId?: string) {
  const filter: any = { _id: id };
  if (townId) filter.townId = townId;
  const doc = await this.model.findOneAndUpdate(filter, dto, { new: true });
  if (!doc) throw new NotFoundException(`... ${id} not found`);
  return doc;
}
```

### Encryption

`EncryptionService` (`src/common/encryption/`) encrypts sensitive fields with AES-256-GCM (Node built-in `crypto`). Format: `iv:authTag:ciphertext` (all hex). The key is `ENCRYPTION_KEY` — a 64-char hex string (32 bytes). Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`TownsService` encrypts `notionApiKey` on `create`/`update`, decrypts on every read. `TownsController` masks the field as `"secret_****"` in HTTP responses. A `try/catch` in `decryptTown()` passes plaintext through for legacy rows created before encryption was added.

---

## Known Issues & Fixes

### NestJS route ordering — static before parameterized

Static route segments **must be declared before** parameterized ones, or NestJS matches the param first.

**Bug:** `POST /notion/sync/me` was declared after `POST /notion/sync/:townId` → the string `"me"` was matched as a townId.

**Fix:** Declare `syncMine` first in the controller class.

> Rule: any time you add a route like `/:id/something` alongside `/something/static`, put the static one first.

### Service method signature drift

When you add a parameter to a service method, find every caller — controller **and** spec file.

**Bug:** `RegulationsService.findAll(townId, category)` had `townId` as required. The controller called `this.service.findAll(category)` (no townId), silently passing category as townId and filtering nothing correctly.

**Fix:** Made `townId` optional; checked all callers.

### Mongoose mock chain must match the real chain

When a service uses `.find().populate().exec()` and `.find().populate().sort().exec()`, the `populateMock` must expose **both** `.exec()` directly and `.sort().exec()`:

```ts
populateMock.mockReturnValue({
  sort: jest.fn().mockReturnValue({ exec: execMock }),
  exec: execMock,   // ← required for chains that skip sort
});
```

### `toObject()` mock — method, not arrow function with arg

An arrow function `const toObject = (obj) => ({ ...obj })` used as a Mongoose document method receives **no arguments** when called as `doc.toObject()`. The spread of `undefined` returns `{}`.

**Fix:** Always write the mock as a real method using `this` or a closure:

```ts
function makeDoc(data) {
  return { ...data, toObject() { return { ...data }; } };
}
```

---

## Toolchain Gotchas

### @swc/jest required for TypeScript 6 + NestJS decorators

`ts-jest` only supports TypeScript up to v5. Use `@swc/jest` with a `.swcrc`:

```json
{ "jsc": { "parser": { "syntax": "typescript", "decorators": true },
           "transform": { "decoratorMetadata": true, "legacyDecorator": true } } }
```

### Biome v2 — NestJS-specific config

Two Biome rules break NestJS code and must be turned off:

- `useImportType: "off"` — converting imports to `import type` breaks `emitDecoratorMetadata`
- `"unsafeParameterDecoratorsEnabled": true` — required for `@Body()`, `@Param()`, etc.

### Anthropic SDK Jest mock needs `__esModule: true`

The SDK uses ESM default export. Without the flag, `_sdk.default is not a constructor`:

```ts
jest.mock('@anthropic-ai/sdk', () => ({ __esModule: true, default: jest.fn().mockImplementation(...) }));
```

### `@notionhq/client` v5 — use `client.request()` for database queries

In v5, `databases.query` was removed from the typed surface. `dataSources.query` is **not** a replacement — it hits `POST /data_sources/{id}/query` (a different Notion product). The correct call is via the low-level `request` method:

```ts
const response = await (client as any).request({
  path: `databases/${databaseId}/query`,
  method: 'post',
  body: { start_cursor: cursor, page_size: 100 },
});
```

The underlying HTTP endpoint `POST /v1/databases/{id}/query` still works in the Notion API — only the typed SDK wrapper was removed.

### Telegraf handler return types — always annotate `Promise<void>`

With pnpm's virtual store paths, TypeScript TS2883 fires when handler return types reference `TextMessage` from `@telegraf/types`. Fix: annotate every `@Command`/`@On`/`@Start` method with `: Promise<void>` and replace `return ctx.reply(...)` with `await ctx.reply(...); return`.
