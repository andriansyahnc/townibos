import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { PaymentsModule } from '../payments/payments.module';
import { RagModule } from '../rag/rag.module';
import { ResidentsModule } from '../residents/residents.module';
import { TownsModule } from '../towns/towns.module';
import { TelegramUpdate } from './telegram.update';
import { TelegramWebhookController } from './telegram.webhook.controller';
import { TelegramWebhookService } from './telegram.webhook.service';

@Module({
  imports: [RagModule, ResidentsModule, AnnouncementsModule, PaymentsModule, TownsModule],
  controllers: [TelegramWebhookController],
  providers: [TelegramUpdate, TelegramWebhookService],
})
export class TelegramModule {}
