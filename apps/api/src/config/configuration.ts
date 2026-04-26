export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/townibos',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  adminApiKey: process.env.ADMIN_API_KEY,
  corsOrigins: process.env.CORS_ORIGINS || '*',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@townibos.com',
  },
});
