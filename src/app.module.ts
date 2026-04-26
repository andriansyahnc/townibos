import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegrafModule } from 'nestjs-telegraf';
import configuration from './config/configuration';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotionModule } from './modules/notion/notion.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RagModule } from './modules/rag/rag.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TownsModule } from './modules/towns/towns.module';
import { UnitsModule } from './modules/units/units.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
      }),
    }),

    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('telegram.botToken'),
      }),
    }),

    AuthModule,
    TownsModule,
    ResidentsModule,
    UnitsModule,
    AnnouncementsModule,
    PaymentsModule,
    RegulationsModule,
    TelegramModule,
    RagModule,
    NotionModule,
  ],
})
export class AppModule {}
