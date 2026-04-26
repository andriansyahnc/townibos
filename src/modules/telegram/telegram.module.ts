import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { PaymentsModule } from '../payments/payments.module';
import { RagModule } from '../rag/rag.module';
import { ResidentsModule } from '../residents/residents.module';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [RagModule, ResidentsModule, AnnouncementsModule, PaymentsModule],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
