# Townibos

Residential complex (perumahan) management system — CRM for managing residents, units, payments, and announcements. Includes a Telegram bot for resident self-service and a RAG-powered chatbot that answers regulation queries in Bahasa Indonesia using Claude AI.

## Features

- **Resident & unit management** — CRUD for penghuni and hunian, with owner/tenant roles
- **Payment tracking** — Tagihan for iuran, listrik, air, parkir with period-based status (pending/paid/overdue)
- **Announcements** — Pengumuman with optional Telegram broadcast flag
- **Telegram bot** — Residents link their account via phone number, then check bills and ask questions directly in Telegram
- **RAG chatbot** — Answers questions about peraturan perumahan grounded in documents stored in the database
- **Semantic FAQ cache** — Previously answered questions are cached with vector embeddings; similar questions return instantly without calling Claude
- **REST API** — Full CRUD for all resources under `/api/v1`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v11 |
| Database | MongoDB via Mongoose |
| Auth | JWT (passport-jwt) |
| Telegram bot | nestjs-telegraf + Telegraf v4 |
| AI / RAG | Anthropic Claude (`claude-sonnet-4-6`) |
| Embeddings | Voyage AI (`voyage-3-lite`) |
| Language | TypeScript |

## Quick Start

See [INSTALL.md](./INSTALL.md) for full setup instructions.

```bash
cp .env.example .env   # fill in tokens
npm install
npm run start:dev
```

## API Overview

All routes are prefixed `/api/v1`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Get JWT token |

Default credentials (boilerplate only — replace before production): `admin` / `admin123`

### Residents
| Method | Path | Description |
|---|---|---|
| POST | `/residents` | Create resident |
| GET | `/residents` | List all residents |
| GET | `/residents/:id` | Get single resident |
| PATCH | `/residents/:id` | Update resident |
| DELETE | `/residents/:id` | Delete resident |

### Units
| Method | Path | Description |
|---|---|---|
| POST | `/units` | Create unit |
| GET | `/units?status=vacant` | List units (filter by status) |
| GET | `/units/:id` | Get single unit |
| PATCH | `/units/:id` | Update unit |
| DELETE | `/units/:id` | Delete unit |

Unit `status` values: `vacant`, `occupied`, `maintenance`

### Payments
| Method | Path | Description |
|---|---|---|
| POST | `/payments` | Create payment record |
| GET | `/payments?status=overdue&residentId=...` | List payments |
| GET | `/payments/overdue` | All overdue payments |
| GET | `/payments/:id` | Get single payment |
| PATCH | `/payments/:id/pay` | Mark as paid |

Payment `type` values: `iuran`, `listrik`, `air`, `parkir`, `lainnya`  
Payment `period` format: `YYYY-MM` (e.g. `2025-01`)

### Announcements
| Method | Path | Description |
|---|---|---|
| POST | `/announcements` | Create announcement |
| GET | `/announcements` | List all (newest first) |
| GET | `/announcements/:id` | Get single announcement |
| DELETE | `/announcements/:id` | Delete announcement |

Announcement `category` values: `general`, `maintenance`, `payment`, `emergency`

### Regulations
| Method | Path | Description |
|---|---|---|
| POST | `/regulations` | Add regulation document |
| GET | `/regulations?category=parkir` | List regulations |
| GET | `/regulations/:id` | Get single regulation |
| PATCH | `/regulations/:id` | Update regulation |
| DELETE | `/regulations/:id` | Delete regulation |

Regulation `category` values: `tata_tertib`, `iuran`, `fasilitas`, `parkir`, `hewan`, `renovasi`, `lainnya`

### RAG Chatbot
| Method | Path | Description |
|---|---|---|
| POST | `/rag/query` | Ask a question (`{ "question": "..." }`) |
| POST | `/rag/refresh` | Reload regulations into AI context |

> Call `/rag/refresh` after adding or updating any regulation.

### FAQ Cache (Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/faq-cache` | List all cached Q&A entries |
| GET | `/faq-cache/:id` | Get single entry |
| PATCH | `/faq-cache/:id` | Edit cached answer |
| DELETE | `/faq-cache/:id` | Remove entry (forces Claude on next similar question) |

Requires JWT. Entries are auto-created when Claude answers a question. Requires `VOYAGE_API_KEY` in `.env`.

## Telegram Bot Commands

Residents interact with the bot using these commands:

| Command | Description |
|---|---|
| `/start` | Welcome message and command list |
| `/daftar <nomor HP>` | Link Telegram account to resident profile |
| `/pengumuman` | Show the 3 latest announcements |
| `/tagihan` | Show unpaid bills for the linked resident |
| `/tanya <pertanyaan>` | Ask a regulation question |

Plain text messages (no command prefix) are also routed to the RAG chatbot.

## Data Model Relationships

```
Unit (1) ──── (0..1) Resident ──── (0..*) Payment
                                         └── refs Unit + Resident
Regulation ──── (feeds) ──── RagService (in-memory context)
```

## Project Structure

```
src/
├── config/               Typed env config
├── main.ts               Bootstrap (port, global prefix, CORS, validation)
├── app.module.ts         Root module
└── modules/
    ├── auth/             JWT login
    ├── residents/        Penghuni
    ├── units/            Hunian
    ├── announcements/    Pengumuman
    ├── payments/         Tagihan
    ├── regulations/      Peraturan (RAG source docs)
    ├── rag/              Claude-powered Q&A
    ├── faq-cache/        Semantic FAQ cache (embeddings + cosine similarity)
    └── telegram/         Bot update handlers
```
