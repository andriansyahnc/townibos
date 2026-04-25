# Copilot Instructions

Townibos is a **residential complex (perumahan) CRM** built with NestJS + MongoDB. It serves three surfaces: a REST API, a Telegram bot, and a RAG chatbot for resident regulation queries.

## Stack

- **NestJS** (v11) with `@nestjs/mongoose` for MongoDB, `@nestjs/jwt` + `passport-jwt` for auth
- **nestjs-telegraf** for Telegram bot (long-polling in dev)
- **@anthropic-ai/sdk** (`claude-sonnet-4-6`) for the RAG chatbot
- **TypeScript** — `emitDecoratorMetadata` and `experimentalDecorators` are required

## Module conventions

Each domain module (`residents`, `units`, `payments`, etc.) contains:
- `*.schema.ts` — Mongoose schema with `@Schema`/`@Prop` decorators, exports `XDocument = X & Document`
- `*.service.ts` — injectable service, injected model via `@InjectModel(X.name)`
- `*.controller.ts` — REST controller under `/api/v1/<resource>`
- `*.module.ts` — wires schema, service, controller; exports service if other modules need it

## Key domain rules

- **Resident↔Telegram link**: `Resident.phone` is the join key. `/daftar <phone>` in the bot writes `telegramChatId` via `ResidentsService.linkTelegram()`.
- **Payment period**: always a `'YYYY-MM'` string (e.g. `'2025-01'`), not a Date.
- **RAG context**: `RagService` holds an in-memory string of all regulations. After any create/update to `Regulation`, call `RagService.refreshContext()` or hit `POST /api/v1/rag/refresh`.
- **Config access**: always use `ConfigService.get('dot.notation.key')` — never `process.env` directly in modules. Keys are defined in `src/config/configuration.ts`.
- **API prefix**: all REST routes are under `/api/v1`.

## Telegram bot commands

`/start`, `/pengumuman`, `/tagihan`, `/tanya`, `/daftar` — all handled in `src/modules/telegram/telegram.update.ts` via `nestjs-telegraf` decorators. Any plain text (non-command) message is routed to `RagService.query()`.

## Auth

JWT-only. The admin credentials in `AuthService` are hardcoded for the boilerplate — replace with a DB-backed user lookup before production. Protect endpoints with `@UseGuards(AuthGuard('jwt'))`.
