import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import configuration from './config/configuration';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotionModule } from './modules/notion/notion.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RagModule } from './modules/rag/rag.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { TownsModule } from './modules/towns/towns.module';
import { UnitsModule } from './modules/units/units.module';

// TelegramModule is intentionally excluded — it calls bot.launch() on init
// which requires a valid TELEGRAM_BOT_TOKEN and network access.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/townibos'),
    AuthModule,
    TownsModule,
    ResidentsModule,
    UnitsModule,
    AnnouncementsModule,
    PaymentsModule,
    RegulationsModule,
    RagModule,
    NotionModule,
  ],
})
class SwaggerAppModule {}

async function generate() {
  const app = await NestFactory.create(SwaggerAppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Townibos API')
    .addServer('http://localhost:3000', 'Local development server')
    .setDescription('Residential complex (perumahan) CRM — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI spec written to ${outPath}`);
  await app.close();
}

generate().catch((err) => {
  console.error('❌ Failed to generate OpenAPI spec:', err.message);
  process.exit(1);
});
