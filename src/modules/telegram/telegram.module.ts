import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { RagModule } from '../rag/rag.module';
import { ResidentsModule } from '../residents/residents.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [RagModule, ResidentsModule, AnnouncementsModule, PaymentsModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
