# Installation Guide

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | |
| npm | ≥ 9 | |
| MongoDB | ≥ 6 | Local or Atlas |
| Telegram Bot Token | — | From [@BotFather](https://t.me/BotFather) |
| Anthropic API Key | — | From [console.anthropic.com](https://console.anthropic.com) |
| Notion Integration Token | — | From [notion.so/my-integrations](https://www.notion.so/my-integrations) |

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd townibos
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/townibos

JWT_SECRET=<generate a long random string>
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/telegram/webhook   # only needed in production

ANTHROPIC_API_KEY=<from console.anthropic.com>

NOTION_API_KEY=<from notion.so/my-integrations>
NOTION_DATABASE_ID=<32-char ID from your database URL>
```

### Getting a Telegram bot token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the token it gives you into `TELEGRAM_BOT_TOKEN`

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key under **API Keys**
3. Copy it into `ANTHROPIC_API_KEY`

### Setting up Notion as a regulations CMS

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create a new integration
2. Copy the **Internal Integration Token** (`secret_...`) into `NOTION_API_KEY`
3. In Notion, create a new **Database** (table view) with these properties:
   - `Name` (title) — the regulation title
   - `Category` (select) — add options: `tata_tertib`, `iuran`, `fasilitas`, `parkir`, `hewan`, `renovasi`, `lainnya`
4. Open the database, click **...** → **Connections** → add your integration
5. Copy the database ID from the URL: `notion.so/<workspace>/<DATABASE_ID>?v=...` — it's the 32-char segment before `?v=`
6. Paste it into `NOTION_DATABASE_ID`

Once configured, fill each Notion page with the regulation content. The page body supports headings, bullet lists, and numbered lists.

## 3. Run with Docker (recommended)

This is the easiest way to get the full stack running. Docker Compose handles MongoDB automatically — no separate install needed.

```bash
cp .env.example .env   # fill in TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY, NOTION_* keys
```

**Development** (hot-reload, source files mounted):
```bash
npm run docker:dev
# or: docker compose -f docker-compose.dev.yml up --build
```

**Production** (compiled image):
```bash
npm run docker:prod
# or: docker compose up --build
```

**Stop and remove containers:**
```bash
npm run docker:down
# add -v to also delete the MongoDB volume: docker compose down -v
```

> `MONGODB_URI` is automatically overridden inside Docker to `mongodb://mongo:27017/townibos` — you don't need to set it in `.env` when using Docker Compose.

MongoDB data is persisted in a named volume (`mongo_data`). It survives container restarts but is removed with `docker compose down -v`.

## 3a. Run without Docker

**Start MongoDB locally (macOS with Homebrew):**
```bash
brew services start mongodb-community
```

**MongoDB Atlas:** update `MONGODB_URI` in `.env` with your Atlas connection string.

## 4. Run the application (without Docker)

```bash
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start
```

The API will be available at `http://localhost:3000/api/v1`.

## 5. Seed regulations from Notion

The RAG chatbot has no knowledge until you add regulation documents. The recommended approach is to sync from Notion:

```bash
curl -X POST http://localhost:3000/api/v1/notion/sync
# → { "synced": 5, "errors": 0 }
```

This fetches all pages from your Notion database, upserts them into MongoDB, and auto-refreshes the RAG context. Re-run this whenever you update content in Notion.

**Alternative — seed directly via API (no Notion required):**
```bash
curl -X POST http://localhost:3000/api/v1/regulations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tata Tertib Umum",
    "category": "tata_tertib",
    "content": "Penghuni wajib menjaga kebersihan area bersama. Jam tenang berlaku pukul 22.00–06.00."
  }'

curl -X POST http://localhost:3000/api/v1/rag/refresh
```

## 6. Verify setup

**Get a JWT token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

> The default credentials (`admin` / `admin123`) are hardcoded in `src/modules/auth/auth.service.ts`. Replace with a proper user store before production.

**Test the RAG chatbot:**
```bash
curl -X POST http://localhost:3000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa saja aturan jam tenang?"}'
```

**Test the Telegram bot:**
Send `/start` to your bot in Telegram.

## Telegram: Long-polling vs Webhook

| Mode | When to use | Config |
|---|---|---|
| Long-polling (default) | Local development | No extra config needed |
| Webhook | Production | Set `TELEGRAM_WEBHOOK_URL` and configure your web server/reverse proxy to forward `POST /telegram/webhook` to the app |

In development, the bot runs in long-polling mode automatically when `TELEGRAM_WEBHOOK_URL` is not set.

## Troubleshooting

**`MongooseError: Operation X buffering timed out`**
MongoDB is not running or `MONGODB_URI` is incorrect. Check `brew services list` or your Docker container.

**`TelegramError: 401: Unauthorized`**
`TELEGRAM_BOT_TOKEN` is missing or invalid. Verify with `@BotFather`.

**RAG returns "saya tidak tahu" for everything**
No regulations are loaded. Run the seed step above and call `POST /api/v1/rag/refresh`.

**`AnthropicError: 401`**
`ANTHROPIC_API_KEY` is missing or invalid. Verify in the Anthropic console.

**`APIResponseError: Could not find database`**
`NOTION_DATABASE_ID` is wrong, or the integration hasn't been connected to the database. Go to the Notion database → **...** → **Connections** and add your integration.

**Notion sync returns `synced: 0`**
The database is empty, or all pages are missing the `Name` (title) or body content. Pages with no body are skipped.
