# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # nodemon hot-reload via ts-node
npm run start:debug     # single run via ts-node (no watch)

# Build & production
npm run build           # tsc → dist/
npm run start           # node dist/main

# Type check (no emit)
npx tsc --noEmit

# Tests
npm test                # jest
```

# Lint / format (Biome)
npm run check          # lint + format check
npm run check:fix      # auto-fix lint + format

# Docker
npm run docker:dev     # dev stack with hot-reload (mounts ./src)
npm run docker:prod    # production stack (compiled image)
npm run docker:down    # stop and remove containers

## Architecture

Townibos is a **residential complex (perumahan) CRM** with three integrated surfaces: a REST API, a Telegram bot, and a RAG chatbot for resident queries.

### Module map

```
AppModule
 ├── AuthModule          JWT login; hardcoded admin in auth.service.ts — replace with DB
 ├── ResidentsModule     Penghuni CRUD; phone is the join key to Telegram identity
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

`NotionService.sync()` fetches all pages from the configured Notion database, converts blocks to plain text, and upserts into `Regulation` using `notionPageId` as the key (so re-syncing is idempotent). Supported block types: paragraph, heading 1–3, bulleted/numbered list, to_do, quote, callout, toggle, divider. The sync auto-calls `RagService.refreshContext()` on completion — no manual refresh needed. `NOTION_API_KEY` and `NOTION_DATABASE_ID` must be set. The Notion database should have a `Category` (or `Kategori`) select property; values not matching the enum default to `lainnya`.

### Telegram bot

`TelegramUpdate` uses `nestjs-telegraf` decorators (`@Command`, `@On`, `@Start`). Plain text messages (non-commands) are automatically routed to `RagService.query()`. Residents link their Telegram account via `/daftar <phone>` which matches on `Resident.phone` and writes `telegramChatId`.

### Data relationships

- `Resident` → `Unit` (ObjectId ref, optional — a resident may not yet have a unit assigned)
- `Payment` → `Resident` + `Unit` (both required refs)
- `Regulation` has an `embedding: number[]` field reserved for future vector similarity; currently unused

### Config

All env vars flow through `src/config/configuration.ts` and are accessed via NestJS `ConfigService` using dot-notation keys (e.g. `config.get('telegram.botToken')`). Never read `process.env` directly in modules.

### Global API prefix

All REST routes are prefixed `/api/v1` (set in `main.ts`). Example: `POST /api/v1/auth/login`.
