# Installation Guide

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | |
| npm | ≥ 9 | |
| MongoDB | ≥ 6 | Local or Atlas |
| Telegram Bot Token | — | From [@BotFather](https://t.me/BotFather) |
| Anthropic API Key | — | From [console.anthropic.com](https://console.anthropic.com) |

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
```

### Getting a Telegram bot token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the token it gives you into `TELEGRAM_BOT_TOKEN`

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key under **API Keys**
3. Copy it into `ANTHROPIC_API_KEY`

## 3. Start MongoDB

**Local (macOS with Homebrew):**
```bash
brew services start mongodb-community
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name townibos-mongo mongo:6
```

**MongoDB Atlas:** update `MONGODB_URI` in `.env` with your Atlas connection string.

## 4. Run the application

```bash
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start
```

The API will be available at `http://localhost:3000/api/v1`.

## 5. Seed initial regulations (optional but recommended)

The RAG chatbot has no knowledge until you add regulation documents. Use the API to seed some:

```bash
curl -X POST http://localhost:3000/api/v1/regulations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tata Tertib Umum",
    "category": "tata_tertib",
    "content": "Penghuni wajib menjaga kebersihan area bersama. Jam tenang berlaku pukul 22.00–06.00. Tamu harus lapor ke pos keamanan."
  }'
```

After seeding, call the refresh endpoint to load them into the AI context:

```bash
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
